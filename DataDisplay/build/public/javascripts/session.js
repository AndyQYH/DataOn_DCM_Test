"use strict";
var responseMSG;
var date;
var device;
var data;
var user = location.href.split('/').slice(-1)[0];
console.log(user);
$('.form-session').submit(function (e) {
    e.preventDefault();
    device = window.navigator.userAgent;
    date = new Date(Date.now()).toString();
    data = new FormData(e.target);
    console.log(data);
    let data_json = {};
    data_json = Object.fromEntries(data.entries());
    console.log(data_json);
    $('button').css('disabled', true);
    $.ajax({
        url: `/users/${user}/sessions`,
        type: 'post',
        data: { ...data_json, ...{ 'device': device, 'date': date } },
        success: function (response) {
            if (response) {
                if (response == "success") {
                    var text = `<div class="alert success" id="green-msg">
                                    <span class="closebtn" >&times;</span>
                                    <div class="info-box-content">
                                        <h3>${response}!</h3>
                                    </div>
                                </div>`;
                    $('.form-session').prepend(text);
                    createMsgEvent();
                    location.reload();
                }
            }
        },
        error: function (response) {
            console.log(response);
            var text = `<div class="alert" >
                            <span class="closebtn">&times;</span>
                            <div class="info-box-content">
                                <h3>${response.responseText}</h3>
                            </div>
                        </div>`;
            $('.form-session').prepend(text);
            createMsgEvent();
            if (response.responseText == 'Session Timeout') {
                setTimeout(function () {
                    location.reload();
                }, 500);
            }
            else {
                $('button').css('disabled', false);
                $('#password').value = '';
            }
        }
    });
});
function createMsgEvent() {
    let close = document.getElementsByClassName('closebtn');
    while (close == undefined || close == null) {
        close = document.getElementsByClassName('closebtn');
        console.log("close = " + close);
    }
    for (var i = 0; i < close.length; i++) {
        close[i].onclick = function () {
            let div = this.parentElement;
            div.style.opacity = "0";
            setTimeout(function () {
                div.style.display = "none";
            }, 500);
        };
    }
}
function myValidatePassword(val) {
    console.log('password2');
    console.log(val);
    var password1;
    password1 = $('#Password')[0].value;
    console.log('password1');
    console.log(password1);
    if (password1 != '') {
        if (val == password1) {
            $('.button.success').attr('disabled', false);
            return true;
        }
        else {
            $('.button.success').attr('disabled', true);
            return false;
        }
    }
    return true;
}
function myValidatePassword2(val) {
    console.log('password1');
    console.log(val);
    var password2;
    if ($('#password2')[0].value != '') {
        password2 = $('#password2')[0].value;
        console.log('password2');
        console.log(password2);
        if (val == password2) {
            $('.button.success').attr('disabled', false);
            return true;
        }
        else {
            $('.button.success').attr('disabled', true);
            return false;
        }
    }
    return true;
}
function closeSession() {
    console.log($('.invalid_feedback').css('display'));
    $('.form-session.time-out')[0].reset();
    $('.form-session.time-out').css('opacity', '0');
    $('.form-session.time-out').css('width', '0px');
    $('.form-session.time-out').css('height', '0px');
    $('.form-session.time-out').css('left', '100%');
}
