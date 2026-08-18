const fs = require('fs');

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Fix AdminDashboard.jsx
  if (path.includes('AdminDashboard.jsx')) {
    content = content.replace(/const usersArray = usersRes.data.data \|\| \(Array.isArray\(usersRes.data\) \? usersRes.data : \[\]\);/g, "const usersArray = Array.isArray(usersRes.data?.data) ? usersRes.data.data : (Array.isArray(usersRes.data) ? usersRes.data : []);");
    
    content = content.replace(/setJobs\(jobsRes.data.data \|\| \(Array.isArray\(jobsRes.data\) \? jobsRes.data : \[\]\)\)/g, "setJobs(Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : (Array.isArray(jobsRes.data) ? jobsRes.data : []))");
    
    content = content.replace(/const allM = missionsRes.data.data \|\| \(Array.isArray\(missionsRes.data\) \? missionsRes.data : \[\]\)/g, "const allM = Array.isArray(missionsRes.data?.data) ? missionsRes.data.data : (Array.isArray(missionsRes.data) ? missionsRes.data : [])");
    
    content = content.replace(/setCityStats\(cityStatsRes.data.data \|\| \(Array.isArray\(cityStatsRes.data\) \? cityStatsRes.data : \[\]\)\)/g, "setCityStats(Array.isArray(cityStatsRes.data?.data) ? cityStatsRes.data.data : (Array.isArray(cityStatsRes.data) ? cityStatsRes.data : []))");
    
    content = content.replace(/setDevisList\(devisRes.data\?\.data\?\.demandes \|\| devisRes.data\?\.demandes \|\| \[\]\)/g, "setDevisList(Array.isArray(devisRes.data?.data?.demandes) ? devisRes.data.data.demandes : (Array.isArray(devisRes.data?.demandes) ? devisRes.data.demandes : []))");
    
    content = content.replace(/setAllDevis\(allDevisRes.data\?\.data\?\.demandes \|\| allDevisRes.data\?\.demandes \|\| \[\]\)/g, "setAllDevis(Array.isArray(allDevisRes.data?.data?.demandes) ? allDevisRes.data.data.demandes : (Array.isArray(allDevisRes.data?.demandes) ? allDevisRes.data.demandes : []))");
  }
  
  // Fix AdminUsers.jsx
  if (path.includes('AdminUsers.jsx')) {
    content = content.replace(/const usersData = response.data.data \|\| \(Array.isArray\(response.data\) \? response.data : \[\]\);/g, "const usersData = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);");
  }
  
  fs.writeFileSync(path, content, 'utf8');
}

fixFile('./frontend/src/pages/AdminDashboard.jsx');
fixFile('./frontend/src/pages/AdminUsers.jsx');
console.log('Fixed');
