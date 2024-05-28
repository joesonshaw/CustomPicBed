var storageData = localStorage.imageData ? JSON.parse(localStorage.imageData) : [];
var storageSort = localStorage.sort ? localStorage.sort : 'AESC';
var bedList = localStorage.bedlist ? JSON.parse(localStorage.bedlist) : [];
var customIconPreview = $('#custom-icon-preview');
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');

Date.prototype.format = function(format) {
    var date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S+": this.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
}

function buildHtml() {
    var html = '';
    var imageitemtemplate = $('#image-item-template').html();
    for (var i = 0; i < storageData.length; i++) {
        var item = storageData[i];
        var timestamp = item.date;
        var src = item.imgsrc;
        var thumb = src.replace("large/", "bmiddle/");
        var d = new Date(timestamp);
        html += imageitemtemplate
            .replace(/{{imgsrcthumb}}/g, thumb)
            .replace(/{{date}}/g, d.format('yyyy-MM-dd h:m'))
            .replace(/{{d}}/g, timestamp)
            .replace(/{{imgsrc}}/g, src);
    }
    $('.box').html('<h5>上传历史 <span style="color:#aaa">点击右键删除(仅本地)</span></h5>' + html);
    if (localStorage.customIcon == undefined) {
        $('input:checkbox[id="defaultIcon"]').prop("checked", true);
        customIconPreview.attr('src', 'icon_38.png');
    } else {
        $('input:checkbox[id="customIcon"]').prop("checked", true);
        customIconPreview.attr('src', localStorage.customIconBase64);
    }
    if (localStorage.sort == null) {
        localStorage.sort = storageSort;
    }
    $("#sort").text(localStorage.sort == 'AESC' ? '升序排列' : '降序排列');
}

function removeImgItem(d) {
    for (var i = 0; i < storageData.length; i++) {
        var item = storageData[i];
        var timestamp = item.date;
        if (timestamp == d) {
            storageData.splice(i, 1);
            localStorage.imageData = JSON.stringify(storageData);
            return;
        }
    }
}

$(document).ready(function() {

    // Build HTML on load
    buildHtml();

    var elements = $('#beta-modal-overlay, #beta-modal');
	$('#beta').click(function(){
		elements.addClass('active');
	});
	$('#beta-close-modal').click(function(){
		elements.removeClass('active');
	});
    var diyelements = $('#diy-modal-overlay, #diy-modal');
	$('#diy').click(function(){
		diyelements.addClass('active');
	});
	$('#diy-close-modal').click(function(){
		diyelements.removeClass('active');
	});
    var submitBtn = $('#submit')
    submitBtn.click(function(e) {
        editBedList(1)
    })
    var deleteBtn = $('#delete')
    deleteBtn.click(function(e) {
        if (!$('#delete').hasClass('disabled')) {
            editBedList(0)
        }
    })
    

    $('#sort-reverse').click(function(){
        storageData = storageData.reverse();
        localStorage.imageData = JSON.stringify(storageData);
        localStorage.sort = (localStorage.sort == 'AESC' ? 'DESC' : 'AESC');
        buildHtml();
	});

    $('#chrome-sync').click(function(){
        // TODO: Chrome sync V3
	});

    var version = chrome.runtime.getManifest().version;
    $(".current_version").text(version);

    $(document).on('click','input[type=text]',function(){ this.select(); });

    $('.close').on('click', function() {
        event.preventDefault();
        window.close();
    });
    $('#domain-prefix').on('change', function() {
        var index = $(this)[0].selectedIndex;
	    var selectOption = $(this)[0].options[index];
        localStorage.domain = selectOption.value;
    });

    $('.donate').on('click', function() {
        swal({
            title: "扫码捐助",
            text: '<img width="300" height="300" src="img/wechat.png">' +
                '<span style="margin:20px;font-weight:bold;">或</span>' +
                '<img width="300" height="300" src="img/alipay.jpg">',
            customClass: 'swal-wide',
            confirmButtonText: '关闭',
            html: true
        });
    });

    $(".donate").hover(
        function() {
            $(this).addClass('blinking');
        },
        function() {
            $(this).removeClass('blinking');
        }
    );

    $(".fancybox").fancybox({
        maxWidth: 1000,
        minWidth: 300,
        openEffect: 'fade',
        closeEffect: 'elastic',
        helpers: {
            title: {
                type: 'inside'
            }
        }
    });

    $('#defaultIcon').click(function() {
        $('input:checkbox[id="customIcon"]').prop("checked", false);
        $('input:checkbox[id="defaultIcon"]').prop("checked", true);
        customIconPreview.attr('src', 'icon_38.png');
        localStorage.removeItem('customIcon');
        localStorage.removeItem('customIconBase64');
    });
    $('#customIcon').click(function() {
        $('#custom-icon-file').trigger('click');
        $('input:checkbox[id="customIcon"]').prop("checked", false);
    });

    // canvas.width = canvas.height = 38;
    // var dontLoad = true;
    // customIconPreview.on('load', function() {
    //     if (dontLoad) {
    //         dontLoad = false;
    //         return;
    //     }
    //     if (customIconPreview.attr('src') == 'icon_38.png') {
    //         return;
    //     }
    //     ctx.clearRect(0, 0, 38, 38);
    //     ctx.drawImage(document.getElementById("custom-icon-preview"), 0, 0, 38, 38);
    //     var imageData = ctx.getImageData(0, 0, 38, 38);
    //     chrome.browserAction.setIcon({ imageData: imageData });
    //     localStorage.customIcon = JSON.stringify(imageData.data);
    // });

    var customIconFile = document.getElementById('custom-icon-file');
    customIconFile.addEventListener('change', function() {
        var files = this.files;
        if (files && files.length) {
            var file = files[0];
            if (/image\/[a-z]+/i.test(file.type)) {
                reader = new FileReader();
                reader.onload = function(e) {
                    var result = e.target.result;
                    customIconPreview.attr('src', result);
                    swal({ title: "Woo~!", text: "图标更换成功.", timer: 2000, showConfirmButton: false });
                    localStorage.customIconBase64 = result;
                    $('input:checkbox[id="customIcon"]').prop("checked", true);
                    $('input:checkbox[id="defaultIcon"]').prop("checked", false);
                };
                reader.readAsDataURL(files[0]);
            } else {
                alert('Not an image. Try another one.');
                $('input:checkbox[id="customIcon"]').prop("checked", true);
                $('input:checkbox[id="defaultIcon"]').prop("checked", false);
            }
        }
    });

    $('.page-content').bind('contextmenu', function(e) {
        e.preventDefault();
        var d = $(this).attr("d");
        var div = $(this).parent().parent();
        console.log(div);
        swal({
            title: "确定要删除吗?",
            text: "",
            type: "error",
            showCancelButton: true,
            cancelButtonText: "取消",
            confirmButtonColor: "#D9534F",
            confirmButtonText: "删除"
        }, function() {
            div.fadeOut("fast");
            removeImgItem(d);
        });
    });

    renderBedSelector()
});

// 渲染下拉菜单
function renderBedSelector (id) {
    const lastUpload = id || localStorage.lastUpload || bedList[0]?.id
    let html = ''
    bedList.forEach(item => {
        html+= `<option value="${item.id}">${item.name}</option>`
    });
    $('#bed-select').html(html+'<option value="0">新增</option>')
    $('#bed-select').val(lastUpload)
    if (!lastUpload) {
        $('#delete').addClass('disabled')
    }
    $('#bed-select').on('change', function() {
        var index = $(this)[0].selectedIndex;
	    var selectOption = $(this)[0].options[index];
        if (selectOption.value == 0) {
            $('#delete').addClass('disabled')
        } else {
            $('#delete').removeClass('disabled')
        }
        renderForm()
    });
    renderForm()
}

// 渲染表单
function renderForm() {
    const bedId = $('#bed-select').val()
    const bedInfo = bedList.find(item=>item.id==bedId)
        $('#diy-name').val(bedInfo?.name)
        $('#diy-url').val(bedInfo?.url)
        $('#diy-paramName').val(bedInfo?.paramName)
        $('#diy-jsonPath').val(bedInfo?.jsonPath)
        $('#diy-customHeader').val(bedInfo?.customHeader)
        $('#diy-customBody').val(bedInfo?.customBody)
        $('#diy-preHost').val(bedInfo?.preHost)
}

// 添加1、修改2、删除0图床
function editBedList(action) {
    const bedId = $('#bed-select').val()
    const bedInfo = bedList.find(item=>item.id==bedId)
    const lastUpload = localStorage.lastUpload
    var bedlist = localStorage.bedlist ? JSON.parse(localStorage.bedlist) : [];
    let editId = undefined
    let newList = []
    if (action) {
        var name = $('#diy-name').val(), url = $('#diy-url').val(), 
        paramName = $('#diy-paramName').val(), jsonPath = $('#diy-jsonPath').val(),
        customHeader = $('#diy-customHeader').val(), customBody = $('#diy-customBody').val(),
        preHost = $('#diy-preHost').val();
        let newItem = {
            name,url,paramName,jsonPath,customHeader,customBody, preHost
        }
        if (bedId==0 || !bedId) {
            // 添加
            newItem.id = new Date().getTime()
            bedlist.push(newItem)
            newList = bedlist
        } else {
            // 修改
            newItem.id = bedInfo?.id
            let data = bedlist.filter(item => item.id!=bedInfo?.id)
            // splice方法的三个参数：起始位置 要删除的项数 要添加的项
            data.splice(0, 0, newItem)
            newList = data
        }
        editId = newItem.id
    } else {
        // 删除
        newList = bedlist.filter(item=>item.id != bedInfo?.id)
        if (lastUpload == bedInfo?.id) {
            localStorage.removeItem('lastUpload')
        }
    }
    localStorage.bedlist = JSON.stringify(newList)
    bedList = newList
    renderBedSelector(editId)
}