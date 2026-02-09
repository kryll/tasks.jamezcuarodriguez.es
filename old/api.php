<?php
// api.php - Fix para selección de proyectos/TAM

error_reporting(E_ALL);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// CONFIGURACIÓN BBDD
$host = 'localhost';
$db   = 'focusdeck_db';
$user = 'focusdeck_user';
$pass = '21jzYK!G$jockk1z'; 
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error DB: ' . $e->getMessage()]);
    exit();
}

$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true) ?? [];

try {
    if (empty($action)) { echo json_encode(['status' => 'API Online']); exit(); }

    switch ($action) {
        // --- CLIENTS ---
        case 'getClients': $stmt = $pdo->query("SELECT * FROM clients ORDER BY name ASC"); echo json_encode($stmt->fetchAll()); break;
        case 'addClient': $stmt = $pdo->prepare("INSERT INTO clients (name) VALUES (?)"); $stmt->execute([$input['name']]); echo json_encode(['id' => $pdo->lastInsertId()]); break;
        case 'updateClient': 
            $fields=[];$vals=[]; if(isset($input['name'])){$fields[]="name=?";$vals[]=$input['name'];} if(isset($input['hidden'])){$fields[]="hidden=?";$vals[]=$input['hidden']?1:0;} 
            if($fields){$vals[]=$id; $pdo->prepare("UPDATE clients SET ".implode(',',$fields)." WHERE id=?")->execute($vals);} echo json_encode(['success'=>true]); break;
        case 'deleteClient': $pdo->prepare("DELETE FROM clients WHERE id=?")->execute([$id]); echo json_encode(['success'=>true]); break;

        // --- TAM CUSTOMERS ---
        case 'getTamCustomers':
            try {
                $stmt = $pdo->query("SELECT * FROM tam_customers ORDER BY name ASC");
                $customers = $stmt->fetchAll();
                foreach($customers as &$c) { $c['services'] = json_decode($c['services'] ?? '{}'); }
                echo json_encode($customers);
            } catch (Exception $e) { echo json_encode([]); }
            break;
        case 'addTamCustomer':
            if (empty($input['code']) || empty($input['name'])) throw new Exception("ID y Nombre obligatorios");
            $stmt = $pdo->prepare("INSERT INTO tam_customers (code, name, docs_url, services) VALUES (?, ?, ?, ?)");
            $stmt->execute([$input['code'], $input['name'], $input['docs_url'] ?? '', json_encode($input['services'] ?? new stdClass())]);
            echo json_encode(['id' => $pdo->lastInsertId()]);
            break;
        case 'deleteTamCustomer': $pdo->prepare("DELETE FROM tam_customers WHERE id=?")->execute([$id]); echo json_encode(['success'=>true]); break;

        // --- CONTEXTS ---
        case 'getContexts': 
            try { $stmt = $pdo->query("SELECT * FROM contexts ORDER BY name ASC"); echo json_encode($stmt->fetchAll()); } catch (Exception $e) { echo json_encode([]); } break;
        case 'addContext': $stmt = $pdo->prepare("INSERT INTO contexts (name) VALUES (?)"); $stmt->execute([$input['name']]); echo json_encode(['id' => $pdo->lastInsertId()]); break;
        case 'deleteContext': $pdo->prepare("DELETE FROM contexts WHERE id=?")->execute([$id]); echo json_encode(['success'=>true]); break;

        // --- PROJECTS ---
        case 'getProjects': 
            $stmt = $pdo->query("SELECT * FROM projects"); $projects = $stmt->fetchAll();
            foreach($projects as &$p) {
                $p['tags'] = json_decode($p['tags'] ?? '[]');
                $jStmt = $pdo->prepare("SELECT * FROM project_journal WHERE project_id = ? ORDER BY created_at DESC"); $jStmt->execute([$p['id']]); $p['journal'] = $jStmt->fetchAll();
            } echo json_encode($projects); break;
        case 'addProject': $stmt = $pdo->prepare("INSERT INTO projects (client_id, name, due_date, color, tags, status) VALUES (?, ?, ?, ?, ?, 'active')"); $stmt->execute([$input['client_id'], $input['name'], $input['due_date'] ?: null, $input['color'] ?? 'bg-blue-500', json_encode([])]); echo json_encode(['id' => $pdo->lastInsertId()]); break;
        case 'updateProject':
            $fields=[];$vals=[]; if(isset($input['status'])){$fields[]="status=?";$vals[]=$input['status'];} if(isset($input['name'])){$fields[]="name=?";$vals[]=$input['name'];} if(isset($input['color'])){$fields[]="color=?";$vals[]=$input['color'];} 
            if($fields){$vals[]=$id; $pdo->prepare("UPDATE projects SET ".implode(',',$fields)." WHERE id=?")->execute($vals);} echo json_encode(['success'=>true]); break;
        case 'addJournal': $stmt = $pdo->prepare("INSERT INTO project_journal (project_id, content) VALUES (?, ?)"); $stmt->execute([$input['project_id'], $input['content']]); echo json_encode(['success' => true]); break;
        case 'deleteProject': $pdo->prepare("DELETE FROM projects WHERE id=?")->execute([$id]); echo json_encode(['success'=>true]); break;

        // --- TASKS ---
        case 'getTasks': 
            $stmt = $pdo->query("SELECT * FROM tasks"); $tasks = $stmt->fetchAll();
            foreach($tasks as &$t) { $t['subtasks'] = json_decode($t['subtasks'] ?? '[]'); $t['is_today'] = (bool)$t['is_today']; } echo json_encode($tasks); break;
        case 'addTask': 
            $projId = !empty($input['project_id']) ? $input['project_id'] : null;
            $tamId = !empty($input['tam_customer_id']) ? $input['tam_customer_id'] : null;

            $stmt = $pdo->prepare("INSERT INTO tasks (project_id, tam_customer_id, context_id, title, priority, gtd_list, is_today, subtasks, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'todo')"); 
            $stmt->execute([
                $projId,
                $tamId,
                $input['context_id'] ?? null,
                $input['title'],
                $input['priority'] ?? 'medium',
                $input['gtd_list'] ?? 'inbox',
                (!empty($input['is_today']) && $input['is_today']) ? 1 : 0,
                json_encode([]),
                $input['description'] ?? ''
            ]); 
            echo json_encode(['id' => $pdo->lastInsertId()]); break;
        case 'updateTask':
            $fields=[];$vals=[]; 
            $allowed=['title','status','priority','gtd_list','description','jira_link','confluence_link','reminder_freq','next_reminder','project_id','context_id','tam_customer_id']; 
            foreach($allowed as $f){
                // Usamos array_key_exists para detectar cuando enviamos NULL explícitamente
                if(array_key_exists($f, $input)){ 
                    $fields[]="$f=?"; 
                    // Lógica estricta para claves foráneas: si viene vacío, string "0" o null, guardamos NULL
                    if(($f=='project_id' || $f=='context_id' || $f=='tam_customer_id') && empty($input[$f])) {
                        $vals[]=null;
                    } else {
                        $vals[]=$input[$f]; 
                    }
                }
            }
            if(isset($input['subtasks'])){$fields[]="subtasks=?";$vals[]=json_encode($input['subtasks']);} 
            if(isset($input['is_today'])){$fields[]="is_today=?";$vals[]=$input['is_today']?1:0;}
            if($fields){$vals[]=$id; $pdo->prepare("UPDATE tasks SET ".implode(',',$fields)." WHERE id=?")->execute($vals);} echo json_encode(['success'=>true]); break;
        case 'deleteTask': $pdo->prepare("DELETE FROM tasks WHERE id=?")->execute([$id]); echo json_encode(['success'=>true]); break;

        default: http_response_code(400); echo json_encode(['error' => 'Action not found']);
    }
} catch (Exception $e) { http_response_code(500); echo json_encode(['error' => $e->getMessage()]); }
?>