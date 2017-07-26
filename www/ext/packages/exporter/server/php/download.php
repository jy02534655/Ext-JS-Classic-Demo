<?php

$content = utf8_decode(base64_decode($_POST['content']));
$filename = $_POST['filename'];
$mimeType = $_POST['mime'];

header("Pragma: public");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: public");
header("Content-Description: File Transfer");
header("Content-type: $mime");
header("Content-Disposition: attachment; filename=\"$filename\"");
header("Content-Transfer-Encoding: binary");
header("Content-Length: ".strlen($content));

echo $content;
?>