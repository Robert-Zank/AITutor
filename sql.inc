<?php
       try {
               $dbconn = new PDO($DBSTRING);
       } catch (PDOException $e) {
        		print "Error connecting to database ";
			print_r($e);
                	die();
       	}

Function GET_SQL($sql, ...$GET) {
	global $dbconn;

	$ROW=array();
	if ($prep=$dbconn->prepare($sql)) {
		if ($prep->execute($GET)) {
			while ($row=$prep->fetch(PDO::FETCH_ASSOC)) {
				$ROW[]=$row;
			}
		}
		else {
			$errcode = $dbconn->errorCode();
			$err = $dbconn->errorInfo();
			throw new Exception("SQL Exec Error $errcode  " . print_r($err,true));
		}
	}
	else {
			$errcode = $dbconn->errorCode();
			$err = $dbconn->errorInfo();
			throw new Exception("SQL prep Error $errcode  " . print_r($err,true));
	}
	//$prep->closeCursor();
	return $ROW;
}

Function EXEC_SQL($sql, ...$GET) {

	global $dbconn;

	$rows=-1;
	if ($prep=$dbconn->prepare($sql)) {
		if ($prep->execute($GET)) {
			$rows=$prep->rowCount();
		}
		else {
			$errcode = $dbconn->errorCode();
			$err = $dbconn->errorInfo();
			throw new Exception("SQL Exec Error $errcode  " . print_r($err,true));
		}
		$prep->closeCursor();
	}
	else {
			$errcode = $dbconn->errorCode();
			$err = $dbconn->errorInfo();
			throw new Exception("SQL prep Error $errcode  " . print_r($err,true));
	}
	return $rows;
}
