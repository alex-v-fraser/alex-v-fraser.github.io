<?php
	include($_SERVER['DOCUMENT_ROOT'] . '/../f_data.php');		//подключаем файл с логином и паролем
	$dbname = 'sitemanager';
	$charset = 'utf8mb4';

	mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);	//включаем сообщения об ошибках
	$db = new mysqli($host, $user, $pass, $dbname, $port);		// коннект с сервером
	$db->set_charset($charset);									// задаем кодировку
	$db->options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);
	unset($host, $dbname, $user, $pass, $charset, $port);		// we don't need them anymore