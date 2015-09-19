var ui = require('sdk/ui');
var self = require("sdk/self");
var Panel = require("sdk/panel").Panel;
var Request = require("sdk/request").Request;
var tabs = require("sdk/tabs");

var activeTab;
var panel;
var button = ui.ToggleButton({
  id: "csdn-geek",
  label: "极客头条",
  icon: {
    "16": "./icon-16.png",
    "19": "./icon-19.png",
    "48": "./icon-48.png",
    "128": "./icon-128.png"
  },
  onChange: handleClick
});
var tips = Panel({
  width: 350,
  height: 90,
  position: button,
  contentURL: self.data.url("tips.html"),
  contentScript: "self.on('message', function(msg){" +
      'document.getElementById("link").href = "http://geek.csdn.net/news/detail/" + msg.id;' +
      '});',
});
var alert_panel;

function handleClick(state) {
  activeTab = tabs.activeTab;
  if (!state.checked ) {
    return;
  }
  // 页面没加载完成
  if (!(activeTab.url && activeTab.title)) {
    button.state('window', {checked: false});
    return;
  }
  // 空白页面
  if (activeTab.url.startsWith('about:')) {
    alert_panel = Panel({
          width: 250,
          height: 50,
          position: button,
          contentURL: self.data.url("alert.html"),
          onHide: function() {
            button.state('window', {checked: false});
            alert_panel.destroy();
          }
    });
    alert_panel.show();
    return;
  }

  panel = Panel({
    width: 430,
    height: 450,
    position: button,
    contentURL: self.data.url("main.html"),
    contentScriptFile: [
      self.data.url('js/zepto.min.js'),
      self.data.url('js/main.js')
    ],
    contentStyleFile: [
      self.data.url('css/entireframework.min.css'),
      self.data.url('css/main.css')
    ],
    onMessage: function(message) {
      //console.log('onMessage:', message);
    },
    onHide: handleHide,
    onShow: handleShow
  });
  panel.port.on('panel-close', function(data) {
    panel.destroy();
  });
  panel.port.on('submit', function(data) {
    postData(data);
  });
  panel.port.on('link', function(data) {
    tabs.open(data.link);
  });
  panel.show();

}

function showResult(id) {
  tips.postMessage({id: id});
  tips.show();
}

function handleHide() {
  button.state('window', {checked: false});
  panel.destroy();
}

function handleShow() {
  Request({
    url: "http://geek.csdn.net/service/news/forums",
    onComplete: function (response) {
      if (response.headers['Content-Type'].startsWith('text/html') && !response.json) {
        panel.postMessage({type: 'forum-list', data: {'error': '当前用户未登录，请先进行登录！'}});
        tabs.open('https://passport.csdn.net/account/login');
      } else if (response.status !== 200 || response.json.status !== 1) {
        panel.postMessage({type: 'forum-list', data: {'error': '获取子社区列表失败！'}});
      } else {
        panel.postMessage({type: 'forum-list', data: response.json});
      }
    }
  }).get();
  panel.postMessage({
    type: 'init',
    data: {
      url: activeTab.url,
      title: activeTab.title
    }
  });
}

// 提交新数据
function postData(data) {
  Request({
    url: "http://geek.csdn.net/service/news/add_edit",
    content: data,
    onComplete: function (response) {
      if (response.headers['Content-Type'].startsWith('text/html') && !response.json) {
        panel.postMessage({type: 'forum-list', data: {'error': '当前用户未登录，请先进行登录！'}});
        tabs.open('https://passport.csdn.net/account/login');
      } else if (response.status !== 200) {
        panel.postMessage({type: 'error', data: {'error': '提交分享失败！'}});
      } else if (response.json.status !== 1) {
        panel.postMessage({type: 'error', data: response.json});
      } else {
        // 发布成功
        panel.destroy();
        showResult(response.json.data.id);
      }
    }
  }).post();
}
