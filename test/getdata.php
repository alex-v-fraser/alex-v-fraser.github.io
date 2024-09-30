<?php
require_once 'connect.php';
$table_name = "b_lists_field";
$result = $db->query("SELECT * FROM $table_name"); // запрос на выборку
$result2 = $db->query("SHOW COLUMNS FROM $table_name");
$data = [];
$columns = [];
while($row = $result->fetch_assoc())
{
    $data[] = $row; // получаем все строки в цикле по одной и записываем в массив
}

include 'index.php'; //Подключаем файл с HTML шаблоном