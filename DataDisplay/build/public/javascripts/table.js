"use strict";
let data_global = {};
let protocol = 'http';
let host = 'localhost';
let port = 3000;
let source = "bootdevices";
let url = "/" + source;
const button_selected = document.querySelector('.btn-show-selected');
const button_PXEboot = document.querySelector('.btn-boot-pxe');
console.log(button_selected);
button_selected.addEventListener('click', getSelectedItem);
button_PXEboot.addEventListener('click', bootPXE);
function getSelectedItem() {
    let addresses = [];
    let data = {};
    let row_items = document.querySelectorAll('.table.striped.table-border.mt-4 tbody tr');
    console.log(row_items);
    row_items.forEach((item) => {
        if (item.querySelector('input').checked) {
            //console.log("checked row address:")
            let address = item.querySelectorAll('td')[4].innerText;
            addresses.push(address);
        }
    });
    data_global = {
        "credentials:": addresses
    };
    //console.log(data_global)
    console.log(typeof data_global);
}
function bootPXE() {
    let addresses = [];
    let row_items = document.querySelectorAll('.table.striped.table-border.mt-4 tbody tr');
    //console.log(row_items)
    row_items.forEach((item) => {
        if (item.querySelector('input').checked) {
            //console.log("checked row address:")
            let address = item.querySelectorAll('td')[3].innerText;
            let serialNumber = item.querySelectorAll('td')[6].innerText;
            let temp = [address, serialNumber, 'Pxe'];
            addresses.push(temp);
        }
    });
    data_global = {
        "credentials": addresses
    };
    let response = doRESTRequest(data_global, url, 'POST');
    location.href = 'http://localhost:3000/bootdevices';
}
function doRESTRequest(payLoad, url, method) {
    console.log(payLoad);
    let http = new XMLHttpRequest();
    http.open(method, url, true);
    http.setRequestHeader("Content-type", "application/json");
    http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status == 200) {
            alert(http.responseText);
        }
    };
    http.send(JSON.stringify(payLoad));
    return 'returned successfully';
}
