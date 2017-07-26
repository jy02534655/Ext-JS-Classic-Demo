<?php
/**
* This example explains a bit how to do the calculations on the backend.
* You could also choose to use an OLAP server to do the calculations for you.
* You just need to return the proper JSON file back to the pivot grid.
* 
* In this example pivot filtering (label, value and top10) was not implemented.
* 
* Import the dataset.sql file in your MySql database and give it a try.
* Don't forget to properly configure the MySql credentials.
* 
*/


$dbHostname = 'localhost';
$dbUser = 'root';
$dbPass = 'password';
$dbDatabase = 'pivotgrid';
$dbTable = 'mytable';

class RemoteMatrix{
    
    private $conn;
    private $req;
    private $result;
    
    private $dbHostname;
    private $dbUser;
    private $dbPass;
    private $dbDatabase;
    private $dbTable;

    public function __construct($dbHostname, $dbUser, $dbPass, $dbDatabase, $dbTable){
        global $HTTP_RAW_POST_DATA;
        
        $this->dbHostname = $dbHostname;
        $this->dbUser = $dbUser;
        $this->dbPass = $dbPass;
        $this->dbDatabase = $dbDatabase;
        $this->dbTable = $dbTable;
        
        $this->conn = mysql_connect($dbHostname, $dbUser, $dbPass);
        $this->req = json_decode($HTTP_RAW_POST_DATA, true);
        
        mysql_select_db($dbDatabase, $this->conn);
    }
    
    private function disconnect(){
        mysql_close($this->conn);
    }

    public function getConn(){
        return $this->conn;
    }

    public function getTable(){
        return $this->dbTable;
    }

    public function getGrandTotalKey(){
        return $this->req['grandTotalKey'];
    }
    
    public function getKeysSeparator(){
        return $this->req['keysSeparator'];
    }

    public function process(){
        $req = $this->req;
        $grandTotalKey = $this->getGrandTotalKey();
        $result = array();
        
        $leftAxis = new Axis($this, $req['leftAxis']);
        $leftItems = $leftAxis->process();
        
        $topAxis = new Axis($this, $req['topAxis']);
        $topItems = $topAxis->process();
        
        $results = new Results($this, $req['aggregate']);
        
        $results->add(array(
            'key'           => $grandTotalKey,
            'fields'        => array()
        ), array(
            'key'           => $grandTotalKey,
            'fields'        => array()
        ));
        foreach($leftItems as $li){
            $results->add($li, array(
                'key'           => $grandTotalKey,
                'fields'        => array()
            ));
            foreach($topItems as $ti){
                $results->add($li, $ti);
            }
        }

        foreach($topItems as $ti){
            $results->add(array(
                'key'           => $grandTotalKey,
                'fields'        => array()
            ), $ti);
        }
        $resultItems = $results->calculate();
        
        // do some cleanup
        foreach($leftItems as &$item){
            unset($item['level']);
            unset($item['fields']);
        }
        foreach($topItems as &$item){
            unset($item['level']);
            unset($item['fields']);
        }
        foreach($resultItems as &$item){
            unset($item['leftFields']);
            unset($item['topFields']);
        }
        
        $result = array(
            'success'   => true,
            'leftAxis'  => $leftItems,
            'topAxis'   => $topItems,
            'results'   => $resultItems
        );
        
        $this->disconnect();
        $this->toJson($result);
    }
    
    private function toJson($result){
        echo json_encode($result);
    }
    
}

class Results {
    private $matrix;
    private $dimensions = array();
    public $items = array();
    
    public function __construct($matrix, $dimensions){
        $this->matrix = $matrix;
        $this->dimensions = $dimensions;
    }
    
    public function add($left, $top){
        $this->items[] = array(
            'leftKey'       => $left['key'],
            'topKey'        => $top['key'],
            'leftFields'    => $left['fields'],
            'topFields'     => $top['fields'],
            'values'        => array()
        );
    }
    
    public function calculate(){
        foreach($this->items as &$item){
            $sqlSelect = array();
            
            foreach($this->dimensions as $dimension){
                $sqlSelect[] = "{$dimension['aggregator']}({$dimension['dataIndex']}) as {$dimension['id']}";
            }

            $sql = "select " . join(', ', $sqlSelect) . " from {$this->matrix->getTable()}";

            $sqlWhere = array();
            
            foreach($item['leftFields'] as $fKey => $fValue){
                $sqlWhere[] = "{$fKey} = '{$fValue}'";
            }

            foreach($item['topFields'] as $fKey => $fValue){
                $sqlWhere[] = "{$fKey} = '{$fValue}'";
                
            }
            if(count($sqlWhere) > 0){
                $sql .= ' WHERE ' . join(' AND ', $sqlWhere);
            }
            $result = mysql_query($sql, $this->matrix->getConn());
            if($result){
                $row = mysql_fetch_assoc($result);
            }
            
            foreach($this->dimensions as $dimension){
                $item['values'][$dimension['id']] = $row ? $row[$dimension['id']] : 0;
            }
        }
        
        return $this->items;
    }
}

class Axis{
    private $matrix;
    private $dimensions = array();
    public $items = array();
    
    public function __construct($matrix, $dimensions){
        $this->matrix = $matrix;
        $this->dimensions = $dimensions;
    }
    
    public function process(){
        foreach($this->dimensions as $level => $dimension){
            $values = $this->getUniqueValues($dimension);

            if($level == 0){
                foreach($values as $v){
                    $fields = array();
                    $fields[$dimension['dataIndex']] = $v;
                    $this->items[] = array(
                        'level'         => 0,
                        'key'           => crc32($v),
                        'value'         => $v,
                        'name'          => $v,
                        'dimensionId'   => $dimension['id'],
                        'fields'        => $fields
                    );
                }
            }else{
                $items = $this->getItemsByLevel($level - 1);
                
                foreach($items as $item){
                    foreach($values as $v){
                        $fields = $item['fields'];
                        
                        $fields[$dimension['dataIndex']] = $v;
                        $this->items[] = array(
                            'level'         => $level,
                            'key'           => $item['key'] . $this->matrix->getKeysSeparator() . crc32($v),
                            'value'         => $v,
                            'name'          => $v,
                            'dimensionId'   => $dimension['id'],
                            'fields'        => $fields
                        );
                    }
                }
            }
        }
        
        return $this->items;
    }
    
    private function getUniqueValues($dimension){
        $sql = "select distinct {$dimension['dataIndex']} from {$this->matrix->getTable()}";
        if($dimension['sortable']){
            $sql .= " order by {$dimension['dataIndex']} {$dimension['direction']}";
        }
        $result = mysql_query($sql, $this->matrix->getConn());
        $rows = array();

        if($result){
            while ($row = mysql_fetch_assoc($result)) {
                $rows[] = $row[$dimension['dataIndex']];
            }
        }
        
        return $rows;
    }
    
    private function getItemsByLevel($level){
        $items = array();
        
        foreach($this->items as $item){
            if($item['level'] == $level){
                $items[] = $item;
            }
        }
        
        return $items;
    }
}

header('Content-Type: application/json; charset=utf-8');
$m = new RemoteMatrix($dbHostname, $dbUser, $dbPass, $dbDatabase, $dbTable);
$m->process();
    
?>