var storageData = localStorage.imageData ? JSON.parse(localStorage.imageData) : [];
var bedList = localStorage.bedlist ? JSON.parse(localStorage.bedlist) : [];
var version_info = localStorage.version_info ? JSON.parse(localStorage.version_info) : false;

function packMsgReq(type, data) {
	return {
		uuid: function () {
			return 'generate-uuid-4you-seem-professional'.replace(
				/[genratuidyosmpfl]/g, function (c) {
					const r = Math.random() * 16 | 0,
						v = c === 'x' ? r : (r & 0x3 | 0x8);
					return v.toString(16);
				});
		}(),
		type: type,
		data: data,
		timestamp: Date.now()
	};
}
 
const http = {
	request: function (options) {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage(packMsgReq('FetchRequest', options),
				(response) => {
					if (response.state) {
						resolve(response.data);
					} else {
						reject(response.data);
					}
				});
		});
	},
	get: function (options) {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage(packMsgReq('FetchGet', options),
				(response) => {
					if (response.state) {
						resolve(response.data);
					} else {
						reject(response.data);
					}
				});
		});
	},
	post: function (options) {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage(packMsgReq('FetchPost', options),
				(response) => {
					if (response.state) {
						resolve(response.data);
					} else {
						reject(response.data);
					}
				});
		});
	}
};

var Wbpd = Wbpd || {};
Wbpd.prototype={
    is_batch:$(this).data('batch')|0,//当前是否是批量模式
    xhr_arr:[],//用来记录xhr对象,后面用来做abort操作
    pic_num:0,//用来记录上传文件的总个数,后面递减来判断是否上传完成
    init:function(){
        $('input').prop('spellcheck', false);
        $("#optionPage").click(function(event) {
            event.preventDefault();
            chrome.tabs.create({url:'option.html'});
            // window.close();
        });
        //批量模式按钮
        // 批量模式,0关闭,1开启
        $(".btn-batch").on("click",function () {
            Wbpd.prototype.toggleBatch();
        });

        //version_info
        $("#versionDIV").css("display", !version_info ? "block" : "none");

        //给所有图片,带有clicker的全部加上鼠标滑动事件和点击事件
        $('body').on('mouseenter', '.clicker', function() {
            var img_url = $(this).parent().nextAll().find('#res_img').data('url');

            if (img_url != '' && img_url != undefined && $(this).attr('data-url') != 1) {
                $(this).prop('src', img_url);
                $(this).attr('data-url', 1);
            }
        }).on("click", '.clicker', function() {
            $('#input').trigger('click');
        });
        //单图模式下的"复制"按钮 和批量模式下的"一键复制"按钮,添加鼠标划过移除data-tooltip
        $(".btn-copy,.btn-batchcopy").hover(
            function() {
                $(this).removeAttr('data-tooltip');
            },
            function() {
                $(this).blur();
            }
        );

        $("#closeSVG").on("click", function() {
            $("#versionDIV").toggle();
            localStorage.version_info = true;
        });
        //单图模式下的"复制"按钮,添加点击事件
        $(".btn-copy").on("click", function() {
            event.preventDefault();
            $(this).prev().select();
            var dataToCpy = $(this).prev().val();
            document.execCommand('copy');
            $(this).attr("data-tooltip", "复制成功"); //data-tooltip="复制成功"
            document.getSelection().removeAllRanges();
        });
        //批量模式下,给所有图片添加鼠标滑动事件
        $(".batch-model").on('mouseenter', '.batch-img', function() {
            var img_url = $(this).nextAll().find('.batch-url').data('url');

            if (img_url != '' && img_url != undefined && $(this).attr('data-url') != 1) {
                $(this).prop('src', img_url);
                $(this).attr('data-url', 1);
            }
        });
        // //批量模式下,给所有图片添加点击事件
        // $(".batch-model").on('click', '.batch-img',function() {
        //         $('#input').trigger('click');
        //     }
        // );
        //"批量模式"下所有的地址框,添加鼠标划过移除data-tooltip
        $(".batch-model").on('mouseenter', '.batch-url', function() {
            $(this).parent().removeAttr('data-tooltip');
        }).on('mouseleave', '.batch-url', function() {
            $(this).blur();
        });
        //批量模式下,点击叉叉删除事件
        $(".batch-model").on('click', '.fancybox-close', function() {
            if ($(this).parent().parent().children().length == 1) {
                $(this).parent().remove();
                Wbpd.prototype.clearData();
            } else {
                $(this).parent().remove();
            }
        });
        //批量模式下,地址框的获取焦点事件
        $(".batch-model").on('focus', '.batch-url', function() {
            event.preventDefault();
            $(this).select();
            var dataToCpy = $(this).val();
            document.execCommand('copy');
            $(this).parent().attr("data-tooltip", "复制成功"); //data-tooltip="复制成功"
            document.getSelection().removeAllRanges();
        });
        //批量模式下,地址框的获取焦点事件
        $(".res").hover(
            function() {
                $(this).select();
            },
            function() {
                $(this).blur();
            }
        );
        //批量模式下,一键复制所有,添加点击事件
        $('.btn-batchcopy').click(function() {
            var url_list = [];
            $('.batch-img').each(function() {
                url_list.push($(this).nextAll().find('.batch-url').val());
            });
            var text = url_list.join('\n');
            var copyFrom = $('<textarea id="copyFrom"/>');
            copyFrom.css({
                position: "absolute",
                left: "-1000px",
                top: "-1000px",
            });
            copyFrom.text(text);
            $('body').append(copyFrom);
            copyFrom.select();
            document.execCommand('copy');
            $(copyFrom).remove();
            $(this).attr("data-tooltip", "复制成功");
        });

        $("body").on({
            dragleave: function(e) {
                e.preventDefault();
                // e.stopPropagation();
            },
            drop: function(e) {
                e.preventDefault();
                // e.stopPropagation();
            },
            dragenter: function(e) {
                e.preventDefault();
                // e.stopPropagation();
            },
            dragover: function(e) {
                e.preventDefault();
                // e.stopPropagation();
            }
        });

        //exit with ESC press
        $(document).keydown(function(event) {
            if (event.keyCode == 27) {
                window.close();
            }
        });

        //此处是手动选择文件
        $('#input').change(function() {
            event.preventDefault();
            var filesToUpload = document.getElementById('input').files;
            var img_file = [];
            for (var i = 0; i < filesToUpload.length; i++) {
                var file = filesToUpload[i];
                if (/image\/\w+/.test(file.type) && file != "undefined") {
                    img_file.push(file);
                }
            }
            Wbpd.prototype.getImageFile(img_file, filesToUpload.length);
        });

        //此处是拖拽
        // $('body').on("drop",".row",function(e){
        // $(".dragger").on('drop',function(e){
        $("body").on('drop', function(e) {
            e.preventDefault(); //取消默认浏览器拖拽效果
            var fileList = e.originalEvent.dataTransfer.files; //获取文件对象
            var img_file = [];
            for (var i = 0; i < fileList.length; i++) {
                var file = fileList[i];
                if (fileList[0].type.indexOf('image') !== -1 && fileList[0] != "undefined") {
                    img_file.push(file);
                }
            }
            Wbpd.prototype.getImageFile(img_file, fileList.length);
        });

        //HTML5 paste http://www.zhihu.com/question/20893119
        $("body").on("paste", function(e) {
            var oe = e.originalEvent;
            var clipboardData, items, item;
            if (oe && (clipboardData = oe.clipboardData) && (items = clipboardData.items)) {
                var b = false;
                var img_file = [];
                for (var i = 0, l = items.length; i < l; i++) {
                    if ((item = items[i]) && item.kind == 'file' && item.type.match(/^image\//i)) {
                        b = true;
                        img_file.push(item.getAsFile());
                    }
                }
                Wbpd.prototype.getImageFile(img_file, items.length);
                if (b) return false;
            }
        });

    },
    //上传完成或者出错时的处理
    uploadFinishEvent: function() {
        $('#uploadPlaceHolder').prop('src', '1x1.png');
        $('.clicker').css('border', 'none').css('background-color', 'transparent').css('box-shadow','none');
    },
    //切换批量模式
    toggleBatch: function(flag) {
        if (arguments.length > 0 && !isNaN(flag)) {
            var batch = parseInt(flag) > 0 ? 1 : 0;
        } else {
            var batch = $(".btn-batch").data('batch') | 0;
            batch = batch > 0 ? 0 : 1;
        }
        if (batch == 1) {
            Wbpd.prototype.is_batch = batch;
            $(".btn-batch").text('返回默认');
            $(".btn-batch").data('batch', batch);
            $('.single-model').hide();
            $('.btn-batchcopy').parent().css('display', 'block');
            $('.btn-format').parent().css('display', 'inline-block');
            $('.batch-model').show();
        } else {
            Wbpd.prototype.is_batch = batch;
            $(".btn-batch").text('批量模式');
            $(".btn-batch").data('batch', batch);
            $('.single-model').show();
            $('.btn-batchcopy').parent().css('display', 'none');
            $('.btn-format').parent().css('display', 'none');
            $('.batch-model').hide();
        }
    },
    changePicFormat: function(params, callBackImg, i) {
        if (Wbpd.prototype.is_batch > 0 && arguments.length > 1) { //批量模式
            $('#res' + i).data('url', callBackImg); //批量模式,数据存到下面的地址框中
            var url_format = parseInt($(".btn-format").parent().children(".active").prop("value"));
            switch (url_format) {
                case 1:
                    $('#res' + i).val(callBackImg); //原始链接
                    break;
                case 2:
                    $('#res' + i).val('<img src="' + callBackImg + '"/>'); //img
                    break;
                case 3:
                    $('#res' + i).val('[IMG]' + callBackImg + '[/IMG]'); //ubb
                    break;
                case 4:
                    $('#res' + i).val('!['+params.pic_name+'](' + callBackImg + ')'); //markdown
                    break;
                default:
                    $('#res' + i).val(callBackImg);
                    break;
            }
        } else { //单图模式
            $('#res_img').data('url', callBackImg); //单图模式,数据存到第一个输入框
            $('#res_img').val(callBackImg);
            $('#res_html').val('<img src="' + callBackImg + '"/>');
            $('#res_ubb').val('[IMG]' + callBackImg + '[/IMG]');
            $('#res_md').val('!['+params.pic_name+'](' + callBackImg + ')');
            $('#res_img').select();
            document.execCommand("Copy");
        }
        return callBackImg;
    },
    saveUrlToLocal: function(params, image, i) {
        if (Wbpd.prototype.is_batch > 0 && arguments.length > 1) { //批量模式
            $('#res' + i).data('params', params);
            $('#res' + i).data('url', image);
        } else {
            $('#res_img').data('params', params);
            $('#res_img').data('url', image);
            $(".loader-wrap").fadeOut("fast");
            $(".btn-copy").removeClass("disabled");
        }

        //store upload image to localStorage
        if (localStorage.sort == 'DESC') {
            storageData.unshift({
                date: (new Date()).getTime(),
                imgsrc: image
            });
        } else {
            storageData.push({
                date: (new Date()).getTime(),
                imgsrc: image
            });
        }
        localStorage.imageData = JSON.stringify(storageData);
    },
    //批量上传图片时,绘制结果区
    batchDisplay: function(n) {
        var str = '';
        for (var i = 0; i < n; i++) {
            str = str + '\
                        <div class="col-xs-4 col-md-4 col-lg-4">\
                            <div class="fancybox-close"></div>\
                            <img src="placeholder2.png" class="clicker dragger batch-img" id="pic' + i + '">\
                            <div class="progress">\
                                <div class="progress-bar progress-bar-info progress-bar-striped" role="progressbar" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width: 20%">\
                                    <span class="sr-only">20% Complete</span>\
                                </div>\
                            </div>\
                            <div class="input-append" style="display: none">\
                                <span id="span' + i + '">\
                                <input class="res col-xs-12 batch-url" id="res' + i + '" value="" spellcheck="false" readonly="true"/>\
                                </span>\
                            </div>\
                        </div>';
        }
        $('.batch-model').html(str);
    },
    //上传中,禁用返回默认,完成后启用
    toggleBtn: function(flag) {
        if (arguments.length > 0 && !isNaN(flag)) {
            var btn = parseInt(flag) > 0 ? 1 : 0;
        } else {
            var btn = $('.btn-batch').attr('disabled') != 'disabled' ? 0 : 1;
        }
        if (btn === 0) {
            $('.btn-batch').attr('disabled', 'disabled');
            $('.btn-batchcopy').attr('disabled', 'disabled');
        } else {
            $('.btn-batch').removeAttr('disabled');
            $('.btn-batchcopy').removeAttr('disabled', 'disabled');
        }

    },
    getImageFile: function(img_file, flag) {
        if (img_file.length > 0 && ($('.clicker:first').attr('src') != 'placeholder.png' || $('.clicker:last').attr('src') != 'placeholder2.png')) {
            Wbpd.prototype.clearData();
        }
        if (img_file.length > 1 || (img_file.length > 0 && Wbpd.prototype.is_batch > 0)) { //如果选择多个文件,自动切换到批量模式
            Wbpd.prototype.toggleBatch(1);
            Wbpd.prototype.toggleBtn(0); //按钮切换
            Wbpd.prototype.batchDisplay(img_file.length);
        }
        for (var i = 0; i < img_file.length; i++) {
            var file = img_file[i];
            Wbpd.prototype.previewAndUpload(file, i);
        }
        //检测文件是不是图片
        if (img_file.length < 1 && flag) {
            swal("您拖的不是图片~");
            return false;
        }
    },
    //预览和上传
    previewAndUpload: function(file, i) {
        Wbpd.prototype.uploadFinishEvent();
        const bedId = $('#bed-select').val()
        if (!bedId) {
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icon.png",
                title: "提示",
                message: "请先添加自定义图床配置...",
                requireInteraction: true,
            });
            return chrome.tabs.create({url:'option.html'})
        }
        const bedInfo = bedList.find(item=>item.id==bedId)
        localStorage.lastUpload = bedId
        $(".loader-wrap").show();
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e) {
            if (Wbpd.prototype.is_batch != 1) {
                $('.single-model img').prop('src', '1x1.png');
                $('.single-model img').css('background-image', 'url(' + this.result + ')');
                $('.single-model img').css('background-position', 'center');
                $('.file-info').css('display', 'inline-block');
                if (file.name.length > 30) {
                    $("#fileName").text(file.name.substring(0, 8) + "..." + file.name.substring(file.name.length - 8, file.name.length));
                } else {
                    $("#fileName").text(file.name);
                }
                $("#fileSize").text((e.total / 1024).toFixed(2) + " kb");
            } else {
                $('#pic' + i).prop('src', '1x1.png');
                $('#pic' + i).css('background-image', 'url(' + this.result + ')');
                $('#pic' + i).css('background-position', 'center');
            }
        };
        
        const {customBody, customHeader, jsonPath, name, paramName, preHost, url} = bedInfo
        let customBodyObj = {}, customHeaderObj = {}
        try {customBodyObj = JSON.parse(customBody)} catch (e) {}
        try {customHeaderObj = JSON.parse(customHeader)} catch (e) {}

        reader.onloadend = function(e) {
            $(".loader-wrap").fadeOut("fast");
            const blob = dataURLtoBlob(e.target.result)
            var xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", function() { Wbpd.prototype.updateProgress(event, i) });
            Wbpd.prototype.xhr_arr.push(xhr); //保存xhr对象
            Wbpd.prototype.pic_num++; //计数
            var data = new FormData();
            // 设置自定义body
            for (const key in customBodyObj) {
                if (customBodyObj.hasOwnProperty.call(customBodyObj, key)) {
                    const element = customBodyObj[key];
                    data.append([key], element);
                }
            }
            data.append([paramName], blob);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var resText = xhr.responseText;
                        let params;
                        try {
                            const body = JSON.parse(resText);
                            if (body) {
                                try {
                                    let imgUrl = body, image_url = ''
                                    for (let field of jsonPath.split('.')) {
                                        imgUrl = imgUrl[field]
                                    }
                                    //获取成功
                                    params = {
                                        pid: new Date().getTime(),
                                        ext: '.'+getFileExtension(file.name),
                                        pic_name: file.name
                                    };
                                    image_url = preHost+imgUrl
                                    Wbpd.prototype.changePicFormat(params, image_url, i);
                                    Wbpd.prototype.saveUrlToLocal(params, image_url, i);
                                    if (--Wbpd.prototype.pic_num == 0) { //如果图片数递减至0,说明所有图片上传完成
                                        Wbpd.prototype.toggleBtn(1);
                                    }
                                    $('#pic' + i).nextAll('.progress').hide();
                                    $('#pic' + i).nextAll('.input-append').show();
                                    return true;	
                                } catch (e) {
                                    Wbpd.prototype.uploadFinishEvent();
                                    if (--Wbpd.prototype.pic_num == 0) { //如果图片数递减至0,说明所有图片上传完成
                                        Wbpd.prototype.toggleBtn(1);
                                    }
                                    chrome.notifications.create({
                                        type: "basic",
                                        iconUrl: "icon.png",
                                        title: "未提取到图片链接",
                                        message: "请检查自定义配置，接口返回信息:"+resText,
                                        requireInteraction: false,
                                    });
                                }
                            }
                        } catch (e) {
                            return;
                        }
                    } else {
                        swal("图片上传失败...");
                    }
                }
            };
            xhr.open('POST', url);
            // 设置自定义header
            for (const key in customHeaderObj) {
                if (customHeaderObj.hasOwnProperty.call(customHeaderObj, key)) {
                    const element = customHeaderObj[key];
                    xhr.setRequestHeader([key], element)
                }
            }
            xhr.send(data);
        }
    },
    updateProgress: function(evt, i) {
        $('#single-progress').css('display', 'block');
        if (evt.lengthComputable) {
            var percentComplete = evt.loaded / evt.total;
            // $('#pic0').nextAll('.progress').attr('width',percentComplete*100+"%");
            $('#pic' + i).nextAll('.progress').children('.progress-bar').css('width', percentComplete * 100 + "%");

            // hack 检测是否是单图模式
            if($('.single-model:visible')[0]) {
                $('#single-progress').children('.progress-bar').css('width', percentComplete * 100 + "%");
            }
        } else {
            //如果无法计算就给个假的进度条
            $('#pic' + i).nextAll('.progress').children('.progress-bar').css('width', "60%");

        }
    },
    //清空之前的上传数据
    clearData: function() {
        //清空图片的style
        $('.clicker').removeAttr('style');
        Wbpd.prototype.xhr_arr = []; //清空xhr的值

        //清空批量模式中的数据
        $('.batch-model').html('<div style="max-width:220px;"><img src="placeholder2.png" class="dragger clicker"></div>');

        //清空单图模式下的数据
        $('.single-model[class^=col-xs-4] img').prop('src', 'placeholder.png');
        $('.single-model[class^=col-xs-4] img').attr('data-url', 0);

        //清空所有的输入框的内容,包括批量模式和单图模式
        $('.res').each(function() {
            $(this).val('');
            if ($(this).data('url') != undefined) { //如果当前输入框记录了url,就清空
                $(this).data('url', '');
            }
        });
        //将单图模式中"复制"按钮设置为disabled
        $('.btn-copy').each(function() {
            $(this).addClass('disabled');
        });
    },
    imageToBase64: function(url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
          callback(reader.result, xhr.response);
        }
        reader.readAsDataURL(xhr.response);
      };
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.message) {
    //图片请求上传事件
    case 'uploadImageDataByURL':
      var imageURL = request.url;
      if (imageURL) {
        Wbpd.prototype.imageToBase64(imageURL, (base64, data) => {
            Wbpd.prototype.getImageFile([data], 1);
        });
      }
      break;
  }
});

$(function() {
    my = Wbpd.prototype;
    my.init();
    setTimeout(function() { 
        $("#versionDIV").slideUp();
    }, 6000);
    renderBedSelector()
});

// 渲染下拉菜单
function renderBedSelector () {
    const lastUpload = localStorage.lastUpload || bedList[0]?.id
    let html = ''
    bedList.forEach(item => {
        html+= `<option value="${item.id}">${item.name}</option>`
    });
    $('#bed-select').html(html)
    $('#bed-select').val(lastUpload)
}
// 获取文件类型
function getFileExtension(filename) {
    var dotIndex = filename.lastIndexOf('.');
    
    if (dotIndex === -1 || dotIndex === 0 || dotIndex === filename.length - 1) {
      return ""; // 如果没有找到点号，或者点号在首尾位置，则返回空字符串
    }
    

    var extension = filename.substring(dotIndex + 1).toLowerCase();
    return extension;
}

// base64转Blob
const dataURLtoBlob = (dataUrl) => {
	let arr = dataUrl.split(','),
	mime = arr[0].match(/:(.*?);/)[1],
	bstr = atob(arr[1]),
	n = bstr.length,
	u8arr = new Uint8Array(n)
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n)
	}
	return new Blob([u8arr], {
		type: mime,
	})
}	