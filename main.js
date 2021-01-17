const sys = uni.getSystemInfoSync();
const getSDKVersion = (str) => {
  const arr = str.split(".");
  const s = arr.join("");
  return parseInt(s, 10);
};
const platform = sys.platform;
class Mpking {
  globalData = {
    verification: false,
    config: null,
    openid: null,
    user: null,
    announcement: null,
  };

  version = "1.0.0";
  isDev = true;
  application = "";
  baseUrl = "";
  ossUrl = "";
  ossKey = "kokodayo";
  platform = platform;
  runtime = "wechat";
  isWeapp = typeof wx !== "undefined";
  sdkVersion = getSDKVersion(sys.SDKVersion);

  timelineEnabled =
    this.isWeapp &&
    this.sdkVersion >= 2113 &&
    (platform === "android" || platform === "devtools");

  init(options) {
    this.version = options.version || "1.0.0";
    if (process.env.NODE_ENV === "production") {
      this.isDev = false
    } else {
      this.isDev = options.isDev
    }
    this.application = options.application || "";
    this.baseUrl =
      options.baseUrl ||
      (this.isDev ? "http://localhost:9090" : "https://www.noddl.me/v3");
    this.ossUrl = options.ossUrl || "https://bbq.noddl.me";
  }
  getEncryptOSSFileUrl(filename, absolute = false, md5Fn = null) {
    if (!md5Fn) {
      return;
    }
    const timestamp = Math.floor(Date.now() / 1000);
    // const expiresT = timestamp + 100;
    const rand = Math.floor(Math.random() * 100);
    const originUrl = absolute ? filename : `${this.ossUrl}/${filename}`;
    const f = originUrl.replace(this.ossUrl, "");
    const ss = `${f}-${timestamp}-${rand}-0-${ossKey}`;
    const encryptF = md5Fn(ss);
    return `${originUrl}?auth_key=${timestamp}-${rand}-0-${encryptF}`;
  }

  getOSSFileUrl = (filename, absolute = false) =>
    absolute ? filename : `${this.ossUrl}/${filename}`;

  request = (options) => {
    const url = options.absoluteUrl
      ? options.absoluteUrl
      : `${this.baseUrl}${options.url}`;
    const token = uni.getStorageSync("token");
    const params = {
      ...options,
      url,
      header: {
        "Accept-Language": "zh-hans",
      },
    };
    if (!options.withoutToken && token) {
      params.header.Authorization = `Bearer ${token}`;
    }
    return uni.request(params).then((r) => {
      const [err, res] = r;
      if (err) return;
      if (res.statusCode === 401) {
        return this.fetchOpenid(true).then(() => this.request(options));
      }
      if (res.statusCode === 403) {
        uni.hideLoading();
        uni.showToast({
          title: "无权限访问",
          duration: 5000,
          icon: "none",
        });
      } else {
        return res;
      }
    });
  };

  fetchOpenid = (renew = false) => {
    const { openid } = this.globalData;
    if (openid && !renew) {
      return Promise.resolve(openid);
    }
    return uni.login().then((r) => {
      const [_, res] = r;
      return this.request({
        url: "/session/openid",
        method: "POST",
        withoutToken: true,
        data: {
          code: res.code,
          application: this.application,
          type: this.runtime,
        },
      })
        .then((res1) => {
          const { openid, token } = res1.data;
          this.globalData.openid = openid;
          uni.setStorageSync("token", token);
          return openid;
        })
        .catch((err) => {
          console.error(err);
        });
    });
  };

  getConfig = () => {
    if (this.globalData.config) {
      return Promise.resolve(this.globalData.config);
    }
    const url =
      this.runtime === "wechat"
        ? `/announcement/announcements/${this.application}`
        : `/announcement/announcements/${this.application}QQ`;
    return this.request({
      url,
      method: "GET",
    }).then((res) => {
      const config = res.data;
      this.globalData.config = config;
      const currentVersion = uni.getStorageSync("version");
      const shouldShowUpdate = currentVersion !== config.version;
      uni.setStorageSync("version", config.version);
      if (config.version !== this.version) {
        this.globalData.verification = true;
      }
      return {
        ...res.data,
        shouldShowUpdate,
      };
    });
  };

  getQRCode = (openid) => {
    const url = uni.getStorageSync("qrcode");
    if (url) {
      return Promise.resolve(url);
    }
    return this.request({
      url: "/session/qrcode",
      method: "POST",
      data: {
        application: this.application,
        query: `openid=${openid}`,
        path: "pages/home/index",
        type: this.runtime,
      },
    }).then((res) => {
      if (res.data && res.data.url) {
        return uni
          .downloadFile({
            url: res.data.url,
          })
          .then((r) => {
            const [error, res1] = r;
            const path = res1.tempFilePath;
            uni.setStorageSync("qrcode", path);
            return path;
          });
      }
      return "";
    });
  };

  loadImage = (canvas, src) => {
    return new Promise((resolve, reject) => {
      const img = canvas.createImage();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  showTakeoutAd = () => {
    this.globalData.takeoutCounter += 1;
    if (this.globalData.takeoutCounter % 4 !== 0) {
      return;
    }
    const now = new Date();
    const h = now.getHours();
    // 进入一次，3小时不打扰
    const lastEnterTime = uni.getStorageSync("lastEnterTime");
    if (lastEnterTime && now.getTime() - lastEnterTime <= 3 * 60 * 60 * 1000) {
      return;
    }
    if ((h >= 11 && h <= 13) || (h >= 16 && h <= 21) || h === 23) {
      uni.showModal({
        title: "到饭点了",
        content: "送你一个饿了吗、美团无门槛红包（每日仅限2个）",
        confirmText: "立即领取",
        cancelText: "下次",
        success: (res) => {
          if (res.confirm) {
            uni.navigateToMiniProgram({
              appId: "wx6683e80ec901c27c",
              path: `/pages/home/index?from=${this.application}`,
              success: () => {
                uni.setStorageSync("lastEnterTime", now.getTime());
              },
            });
          }
        },
      });
    }
  };

  verifiyText = async (text) => {
    return this.request({
      url: "/session/security/text",
      method: "POST",
      data: {
        text,
        application: this.application,
      },
    }).then((res) => {
      const success = !!res.data.success;
      return success;
    });
  };
}

const mpking = new Mpking();
export default mpking;