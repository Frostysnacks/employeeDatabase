const inquirer = require("inquirer");
const mysql = require('mysql2');
const express = require('express');
require('console.table');

const PORT = process.env.PORT || 3001;

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'buster55',
        database: 'employee_db'
    },
    console.log(`Connected to the employee_db database.`)
);

function viewEmployees() {
    db.query(
     `SELECT employee.id,
        employee.first_name,
        employee.last_name,
        role.title,
        department.name AS department,
        role.salary,
        CONCAT(manager.first_name, ' ', manager.last_name) AS manager
        FROM employee
        JOIN role ON employee.role_id = role.id
        JOIN department ON role.department_id = department.id
        LEFT JOIN employee manager 
        ON manager.id = employee.manager_id;
        `,
        (err, results) => {
            if (err) throw err;
            else {
            console.table(results);
            startPage();
        }
    }
    );
};

function addEmployee() {
    db.query(`SELECT role.id AS value, role.title AS name FROM role`, (err, roleTitle) => {
      if (err) throw err;
      db.query(
      `SELECT CONCAT(employee.first_name, " ", employee.last_name) AS name, 
      employee.id AS value 
      FROM employee 
      WHERE employee.manager_id IS NULL`, (err, employeeName) => {
        if (err) throw err;
        inquirer
        .prompt([
          {
            type: "input",
            message: "Enter the first name of the employee:",
            name: "firstName"
          },
          {
            type: "input",
            message: "Enter the last name of the employee:",
            name: "lastName"
          },
          {
            type: "list",
            message: "Select the role of the employee:",
            choices: roleTitle,
            name: "role"
          },
          {
            type: "list",
            message: "Select the manager of the employee:",
            choices: employeeName,
            name: "manager"
          }
        ]).then((res) => {
          db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id)
          VALUES ("${res.firstName}", "${res.lastName}", "${res.role}", "${res.manager}")`, (err) => {
            if (err) throw err;
            console.log("Added employee to database.");
            startPage();
          })
        })
      })
    });
  }
  function updateRole() {
    db.query(`SELECT employee.id AS value, CONCAT(employee.first_name, ' ', employee.last_name) AS name FROM employee`, (err, employees) => {
      if (err) throw err;
      db.query(`SELECT role.id AS value, title AS name FROM role`, (err, roles) => {
      if (err) throw err;
      inquirer.prompt([
        {
          type: "list",
          message: "Select an employee to change role:",
          choices: employees,
          name: "employee"
        },
        {
          type: "list",
          message: "Select a new role for employee",
          choices: roles,
          name: "role"
        }
      ]).then((res) => {
        db.query(`
        UPDATE employee 
        SET employee.role_id = ${res.role} 
        WHERE employee.id = ${res.employee}`, (err, results) => {
          if (err) throw err;
          console.log("Employee Updated!");
          startPage();
        })
      })
    })
  })
  }
  function viewRoles() {
    db.query(
      "SELECT role.id, title AS Title, salary AS Salary, department.name AS Department FROM role JOIN department ON role.department_id = department.id",
      (err, results) => {
        if (err) {
          return console.error(err);
        } else {
          console.log("\n========== Roles ==========\n");
          console.table(results);
          startPage();
        }
      }
    );
  }
  // Adds a new role to the role table
  function addRole() {
    db.query("SELECT department.name FROM department", (err, results) => {
      inquirer
        .prompt([
          {
            type: "input",
            message: "Enter the name of the role:",
            name: "name",
          },
          {
            type: "number",
            message: "Enter the salary of the role",
            name: "salary",
          },
          {
            type: "list",
            message: "Select the department of the role",
            choices: results,
            name: "department",
          },
        ])
        .then((res) => {
        db.query(`SELECT department.id FROM department WHERE name="${res.department}"`, (err, results) => {
          if (err) throw err;
          db.query(
            `INSERT INTO role (title, salary, department_id)
      VALUES ("${res.name}", "${res.salary}", ${parseInt(results[0].id)})`,
            (err) => {
              if (err) throw err;
              console.log("Added role!");
            startPage();
            }
          );
        })
          
        });
    });
  }
  // Logs a table of the departments with their ids
  function viewDepartments() {
    db.query(
      "SELECT department.id, department.name AS Name FROM department",
      (err, results) => {
        if (err) {
          return console.error(err);
        } else {
          console.log("\n===== Departments =====\n");
          console.table(results);
          startPage();
        }
      }
    );
  }
  function addDepartment() {
    inquirer
      .prompt([
        {
          type: "input",
          message: "Enter the department name:",
          name: "addNewDepartment",
        },
      ])
      .then((department) => {
        db.query(`INSERT INTO department (name)
      VALUES ("${department.addNewDepartment}")`);
        console.log(
          `Successfully added "${department.addNewDepartment}" as new department`
        );
        startPage();
      });
  }
  
  // Prompts list of choices and redirects to another prompt on selection
  function startPage() {
    inquirer
      .prompt([
        {
          type: "list",
          message: "What would you like to do?",
          choices: [
            "View All Employees",
            "Add Employee",
            "Update Employee Role",
            "View All Roles",
            "Add Role",
            "View All Departments",
            "Add Department",
            "Quit",
          ],
          name: "startPage",
        },
      ])
      .then((res) => {
        switch (
          res.startPage // Checking to see which response matches
        ) {
          case "View All Employees":
            viewEmployees();
            break;
          case "Add Employee":
            addEmployee();
            break;
          case "Update Employee Role":
            updateRole();
            break;
          case "View All Roles":
            viewRoles();
            break;
          case "Add Role":
            addRole();
            break;
          case "View All Departments":
            viewDepartments();
            break;
          case "Add Department":
            addDepartment();
            break;
          case "Quit":
            return process.exit();
        }
      });
  }
  
  // Starts program
  startPage();
