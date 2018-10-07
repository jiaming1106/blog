<?php
$name = date("Ymdhis").".cagd";
$path = "savefile/".$name;
$myfile = fopen($path, "w"); 
fwrite($myfile, $_POST["result"]);
fclose($myfile);

$file=fopen($path,"r");
header("Content-Type: application/octet-stream");
header("Accept-Ranges: bytes");
header("Accept-Length: ".filesize($path));
header("Content-Disposition: attachment; filename=".$name);
echo fread($file,filesize($path));
fclose($file);
?>
