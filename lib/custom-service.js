/**
 * Created by sunline on 2017-09-29.
 */

function custom(wechat) {
    if (!(wx instanceof wechat)) throw new Error('微信对象不正确');
    this.wechat = wechat;
}