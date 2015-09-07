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
var alert_panel = Panel({
      width: 250,
      height: 50,
      position: button,
      contentURL: self.data.url("alert.html"),
      contentScript: 'document.getElementById("main").innerHTML = "该页面为空页面，无法分享！"',
      onHide: function() {
        button.state('window', {checked: false});
      }
});

function handleClick(state) {
  activeTab = tabs.activeTab;
  if (!state.checked ) {
    return;
  }
  // 页面没加载完成
  if (activeTab.readyState !== 'interactive' && activeTab.readyState !== 'complete') {
    button.state('window', {checked: false});
    return;
  }
  // 空白页面
  if (activeTab.url.startsWith('about:')) {
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
    //console.log('panel submit', data);
    postData(data);
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
    url: "http://geek.csdn.net/service/news/categories",
    onComplete: function (response) {
      if (response.status !== 200 || response.json.status !== 1) {
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
  // TODO 获取用户名
  data.username = 'test';
  // TODO 判断如果没有登录，则打开登录页面
  //tabs.open('https://passport.csdn.net/');
  Request({
    url: "http://geek.csdn.net/service/news/add_edit",
    content: data,
    onComplete: function (response) {
      console.log('share:', response.status, response.json);
      if (response.status !== 200) {
        panel.postMessage({type: 'error', data: {'error': '提交分享失败！'}});
      } else if (response.json.status !== 1) {
        panel.postMessage({type: 'error', data: response.json.error});
      } else {
        // 发布成功
        panel.destroy();
        showResult(response.json.data.id);
      }
    }
  }).post();
}
