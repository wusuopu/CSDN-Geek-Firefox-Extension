document.getElementById('close-bt').addEventListener('click', function(event) {
  self.port.emit('panel-close', {});
}, false);

$('form').on('submit', function(ev) {
  var isValid = true;
  var eleList = ['url', 'title', 'forum_id'];
  var errMsg = ['请输入网址', '请输入文章标题', '请选择子社区'];
  var data = {};
  var errors = [];

  eleList.forEach(function(value, index){
    var ele = $('#form-' + value).parent('div').parent('.row');
    var v = $('#form-' + value).val().trim();
    data[value] = v;
    if (!v) {
      isValid = false;
      ele.removeClass('success');
      ele.addClass('error');
      errors.push(errMsg[index]);
    } else {
      ele.removeClass('error');
      ele.addClass('success');
    }
  });
  ev.preventDefault();

  if (!isValid) {
    showMessage(errors.join('<br />'));
    return;
  }
  data.description = $('#form-description').val();
  self.port.emit('submit', data);
});

// 点击链接
$('.container').on('click', 'a', function(ev){
  if (ev.target.href !== '#') {
    self.port.emit('link', { link: ev.target.href });
    ev.preventDefault();
  }
});

function showMessage(msg) {
  $('.msg.error').html(msg);
}

$(function(){
  var subMenuVisible = false;
  var btn = $('.dropdown > div');
  btn.on('mouseover', function(ev){
    subMenuVisible = true;
    var topPos = btn.position().top + btn.height();
    $('.dropdown .sub_menu').css('top', topPos);
    $('.dropdown .sub_menu').css('min-width', btn.width());
    $('.dropdown .sub_menu').css('display', 'block');
  }).on('mouseout',function(ev){
    if (subMenuVisible) {
      var x = ev.pageX;
      var y = ev.pageY;
      var menuRect = $('.dropdown .sub_menu').position();
      menuRect.width = $('.dropdown .sub_menu').width();
      menuRect.height = $('.dropdown .sub_menu').height();

      if (!(
            x > menuRect.left && x < menuRect.left + menuRect.width &&
            y > menuRect.top && y < menuRect.top + menuRect.height
           )) {
        subMenuVisible = false;
        $('.dropdown .sub_menu').css('display', 'none');
      }
    }
  });
  $('.dropdown .sub_menu').on('mouseout', function(ev){
    if (subMenuVisible) {
      var x = ev.pageX;
      var y = ev.pageY;
      var btnRect = btn.position();
      btnRect.width = btn.width();
      btnRect.height = btn.height();
      var menuRect = $('.dropdown .sub_menu').position();
      menuRect.width = $('.dropdown .sub_menu').width();
      menuRect.height = $('.dropdown .sub_menu').height();

      if (!(
          (
            x > btnRect.left && x < btnRect.left + btnRect.width &&
            y > btnRect.top && y < btnRect.top + btnRect.height
          ) || (
            x > menuRect.left && x < menuRect.left + menuRect.width &&
            y > menuRect.top && y < menuRect.top + menuRect.height
          )
          )) {
        subMenuVisible = false;
        $('.dropdown .sub_menu').css('display', 'none');
      }
    }
  });
  $('.dropdown .sub_menu').on('click', function(ev){
    if (ev.target.tagName !== 'LI') {
      return;
    }
    var name = $(ev.target).data('name');
    var id = $(ev.target).data('id');
    btn.html(name + '<img src="img/down-arrow.png" alt=""/>');
    $('#form-forum_id').val(id);
    subMenuVisible = false;
    $('.dropdown .sub_menu').css('display', 'none');
  });
});

self.on('message', function(msg){
  var type = msg.type;
  var data = msg.data;
  switch (type) {
    case 'forum-list':
      if (data.error) {
        showMessage(data.error);
      } else {
        var categories = [];
        data.data.forEach(function(v) {
          categories.push(
            '<li data-name="' + v.name +
              '" data-id="' + v.id + '">' + v.name + "</li>"
          );
        });
        $('.dropdown .sub_menu').html(categories.join(''));
      }
      break;
    case 'init':
      $('#form-url').val(data.url);
      $('#form-title').val(data.title);
      break;
    case 'error':
      showMessage(data.error);
      break;
  }
});
