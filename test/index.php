<?php
	require_once 'connect.php';
    // include 'detdata.php';
    // Определим собственный класс исключений для ошибок MySQL
	class MySQL_Exception extends Exception {
		public function __construct($message) {
			parent::__construct($message);
		}
	}
?>


<!DOCTYPE HTML>
<html>
<head>
<meta charset="utf-8">
<title>Начал Изучать PHP и MySQL</title>
<style>
/* Стилизация таблиц */
table { border-collapse:separate; border:none; border-spacing:0; margin:8px 12px 18px 6px; line-height:1.2em; margin-left:auto; margin-right:auto; overflow: auto }
table th { font-weight:bold; background:#666; color:white; border:1px solid #666; border-right:1px solid white }
table th:last-child { border-right:1px solid #666 }
table caption { font-style:italic; margin:10px 0 20px 0; text-align:center; color:#666; font-size:1.2em }
tr{ border:none }
td { border:1px solid #666; border-width:1px 1px 0 0 }
td, th { padding:5px }
tr td:first-child { border-left-width:1px }
tr:last-child td { border-bottom-width:1px }
</style>
</head>
    <body>
        <!-- <?php foreach ($data as $row): ?>
            <div>
                Имя: <?= $row['Имя'] ?>
                Фамилия: <?= $row['Фамилия'] ?>
            </div>
        <?php endforeach ?> -->

        <?php
            $table_name = "b_lists_field";
            try {
                $result = $db->query('SHOW TABLES');//Запрос к базе данных
                if (!$result) throw new MySQL_Exception($db->error);//В случае неудачного запроса генерируем исключение
                echo "<table><caption> $table_name </caption><tr>";
                $result1 = $db->query("SELECT * FROM $table_name");// Получить названия столбцов
                if (!$result1) throw new MySQL_Exception($db->error);
                for($i = 0; $i < $db->field_count; $i++){
                    $field_info = $result1->fetch_field();
                    echo "<th>{$field_info->name}</th>";
                }
                echo '</tr>';
                while ($row1 = $result1->fetch_row()) {// Получить данные
                    if ((int)($result1->fetch_row()[0])===61){
                        echo '<tr>';
                        foreach($row1 as $_column) {
                            echo "<td>{$_column}</td>";
                        }
                        echo "</tr>";
                    }
                }
                echo '</table>';
            }
            catch (Exception $ex) {
                echo 'Ошибка при работе с MySQL: <b style="color:red;">'.$ex->getMessage().'</b>';
            }
        ?>

    </body>
</html>