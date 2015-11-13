'use strict';
var assert = require('assert');
var nodeWeixinPay = require('../');
var errors = require('web-errors').errors;

var nodeWeixinConfig = require('node-weixin-config');
var validator = require('validator');
var validation = require('../conf/validation');

var merchant = require('./config/merchant');

var app = require('./config/app');


describe('node-weixin-pay index', function () {
  it('should have these properties', function () {
    var fucList = ['sign', 'validate', 'prepay', 'prepare', 'request', 'handle'];
    for (var i = 0; i < fucList.length; i++) {
      assert.equal(true, nodeWeixinPay[fucList[i]] instanceof  Function);
    }
    assert.equal(true, nodeWeixinPay.callback.notify instanceof  Function);
    assert.equal(true, nodeWeixinPay.api.order.unified instanceof  Function);
    assert.equal(true, nodeWeixinPay.api.order.query instanceof  Function);
    assert.equal(true, nodeWeixinPay.api.order.close instanceof  Function);
    assert.equal(true, nodeWeixinPay.api.refund.create instanceof  Function);
    assert.equal(true, nodeWeixinPay.api.refund.query instanceof  Function);
    assert.equal(true, nodeWeixinPay.api.statements instanceof  Function);
    assert.equal(true, nodeWeixinPay.api.report instanceof  Function);
  });

  describe('#sign', function () {
    it('should be able to sign a request', function () {
      var params = {
        openid: process.env.OPENID,
        spbill_create_ip: '1.202.241.25',
        notify_url: 'http://wx.domain.com/weixin/pay/main',
        body: '测试支付',
        out_trade_no: '111',
        total_fee: '1',
        trade_type: 'JSAPI',
        appid: app.id,
        mch_id: merchant.id,
        nonce_str: 'XjUw56N8MjeCUqHCwqgiKwr2CJVgYUpe'
      };
      nodeWeixinConfig.merchant.init(merchant);
      var sign = nodeWeixinPay.sign(merchant, params);
      assert.equal(true, sign === '87CF15EEACE2EC8BAE266380B02B0CE9');
    });
  })


  describe("#validate", function () {
    it('should get an error ', function () {
      var error = {};
      var result = nodeWeixinPay.validate(app, merchant, {}, error);
      assert.equal(true, result === errors.ERROR);
      assert.equal(true, error.key === 'appid');
      assert.equal(true, error.reason === 'Key appid is NULL');
    });

    it('should get an error for appid', function () {
      var error = {};
      var result = nodeWeixinPay.validate(app, merchant, {appid: 'aaa', mch_id: 'bb', nonce_str: 'ccc'}, error);
      assert.equal(true, result === errors.APP_ID_ERROR);
    });

    it('should get an error for merchant id', function () {
      var error = {};
      var result = nodeWeixinPay.validate(app, merchant, {appid: app.id, mch_id: 'SODFSOFS', nonce_str: 'ccc'}, error);
      assert.equal(true, result === errors.MERCHANT_ID_ERROR);
    });

    it('should validate ok', function () {
      var error = {};
      var result = nodeWeixinPay.validate(app, merchant, {appid: app.id, mch_id: merchant.id, nonce_str: 'ccc'}, error);
      assert.equal(true, result);
    });
  });

  describe('#prepay', function () {
    it('should be able to prepay', function () {
      var id = 'id';
      nodeWeixinConfig.merchant.init(merchant);
      var config = nodeWeixinPay.prepay(app, merchant, id);
      assert.equal(true, config.appId === app.id);
      assert.equal(true, validator.isNumeric(config.timeStamp));
      assert.equal(true, config.package === 'prepay_id=' + id);
      assert.equal(true, config.signType === 'MD5');
      assert.equal(true, typeof config.paySign === 'string');
      assert.equal(true, typeof config.nonceStr === 'string');
    });
  });
  describe('#prepare', function () {
    it('should be able to prepare', function () {
      var id = 'id';
      nodeWeixinConfig.merchant.init(merchant);
      var data = {};
      var config = nodeWeixinPay.prepare(app, merchant, data);
      assert.equal(true, config.appid === app.id)
      assert.equal(true, config.mch_id === merchant.id)
      assert.equal(true, typeof config.nonce_str === 'string');
      assert.equal(true, config.nonce_str.length >= 1);
      assert.equal(true, nodeWeixinPay.validate(app, merchant, config));
    });
  });

  describe('#handle', function () {
    it('should be able to handle response FAILED', function (done) {
      var id = 'id';
      nodeWeixinConfig.merchant.init(merchant);
      var data = {
        return_code: 'FAILED',
        return_msg: '失败!',
        appid: app.id,
        mch_id: merchant.id,
        nonce_str: 'sodsfd'
      };
      nodeWeixinPay.handle(app, merchant, data, validation.auth.unified, function (error, result, data) {
        assert.equal(true, error);
        done();
      });
    });

    it('should be able to handle response SUCCESS without data', function (done) {
      var id = 'id';
      nodeWeixinConfig.merchant.init(merchant);
      var data = {
        return_code: 'SUCCESS',
        return_msg: '成功!',
        appid: app.id,
        mch_id: merchant.id,
        nonce_str: 'sodsfd'
      };
      nodeWeixinPay.handle(app, merchant, data, null, function (error, result, data) {
        assert.equal(true, !error);
        done();
      });
    });

    it('should fail to handle response SUCCESS without data when validator specified', function (done) {
      var id = 'id';
      nodeWeixinConfig.merchant.init(merchant);
      var data = {
        return_code: 'SUCCESS',
        return_msg: '成功!',
        appid: app.id,
        mch_id: merchant.id,
        nonce_str: 'sodsfd'
      };
      nodeWeixinPay.handle(app, merchant, data, validation.unified.receiving, function (error, result, data) {
        assert.equal(true, error);
        done();
      });
    });

    it('should fail to handle response SUCCESS with data', function (done) {
      var id = 'id';
      nodeWeixinConfig.merchant.init(merchant);
      var data = {
        return_code: 'SUCCESS',
        return_msg: '成功!',
        appid: app.id,
        mch_id: merchant.id,
        nonce_str: 'sodsfd',
        result_code: 'SUCCESS'
      };
      nodeWeixinPay.handle(app, merchant, data, validation.unified.receiving, function (error, result, data) {
        assert.equal(true, error);
        done();
      });
    });

    it('should be able to handle response SUCCESS with data', function (done) {
      var id = 'id';
      nodeWeixinConfig.merchant.init(merchant);
      var data = {
        return_code: 'SUCCESS',
        return_msg: '成功!',
        appid: app.id,
        mch_id: merchant.id,
        nonce_str: 'sodsfd',
        result_code: 'SUCCESS',
        trade_type: 'dodo',
        prepay_id: '18383'
      };
      nodeWeixinPay.handle(app, merchant, data, validation.unified.receiving, function (error, result, data) {
        assert.equal(true, !error);
        done();
      });
    });
  });
  describe('#request', function () {
    it('should fail to sending data mismatch with config', function () {
      var id = 'id';
      nodeWeixinConfig.merchant.init(merchant);
      var data = {};
      var config = nodeWeixinPay.prepare(app, merchant, data);
      assert.equal(true, config.appid === app.id)
      assert.equal(true, config.mch_id === merchant.id)
      assert.equal(true, typeof config.nonce_str === 'string');
      assert.equal(true, config.nonce_str.length >= 1);
      assert.equal(true, nodeWeixinPay.validate(app, merchant, config));
    });
  });
});