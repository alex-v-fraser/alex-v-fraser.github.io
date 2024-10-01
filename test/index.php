<?php
	require_once 'connect.php';
	class MySQL_Exception extends Exception {   // Определим собственный класс исключений для ошибок MySQL
		public function __construct($message) {
			parent::__construct($message);
		}
	}
?>


<!DOCTYPE HTML>
<html>
<head>
<meta charset="utf-8">
<title>Специальные исполнения</title>
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
            $table_name = "b_iblock_element";
            $query = "SELECT `ID`, `NAME` FROM $table_name WHERE `IBLOCK_ID` = '61'";
            $result = $db->query($query); /// Получаем соответствие имени элемента списка и его ID (NAME => ID)
            if (!$result) throw new MySQL_Exception($db->error);
            $elements = [];
            while($row = $result->fetch_assoc()){
                $elements[$row["ID"]] = $row["NAME"]; // получаем все строки в цикле по одной и записываем в массив
            }

            $table_name = "b_iblock_property";
            $query = "SELECT `ID`, `NAME` FROM $table_name WHERE `IBLOCK_ID` = '61'";
            $result = $db->query($query); /// Получаем соответствие имени поля и его ID (NAME => ID)
            if (!$result) throw new MySQL_Exception($db->error);
            $properties = [];
            while($row = $result->fetch_assoc()){
                $properties[$row["ID"]] = $row["NAME"]; // получаем все строки в цикле по одной и записываем в массив
            }

            try {
                $prop_nums = [823, 300, 320]; // 299, 302,
                echo "<table><caption>СПЕЦИАЛЬНЫЕ ИСПОЛНЕНИЯ</caption><tr><th>№п/п</th><th>Наименование</th>";
                foreach($prop_nums as $val){
                    echo "<th>{$properties[$val]}</th>";
                }
                echo '</tr>';
                $table_name = "b_iblock_element_property";
                $num=1;
                foreach($elements as $key => $value){
                    echo "<tr><td>{$num}</td><td>{$value}</td>";
                    foreach($prop_nums as $val) {
                        $query = "SELECT `VALUE` FROM $table_name WHERE `IBLOCK_PROPERTY_ID` = $val AND `IBLOCK_ELEMENT_ID` = $key";
                        $result = $db->query($query)->fetch_all(MYSQLI_ASSOC);
                        $_column = ($result[0]["VALUE"]);
                        echo "<td>{$_column}</td>";
                    }
                    echo "</tr>";
                    $num+=1;
                }
                echo '</table>';
            }
            catch (Exception $ex) {
                echo 'Ошибка при работе с MySQL: <b style="color:red;">'.$ex->getMessage().'</b>';
            }
        ?>

    </body>
</html>