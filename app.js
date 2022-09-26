const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const resultantQuery = (data) => {
  return {
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const res = [];
  const priorities = ["HIGH", "MEDIUM", "LOW"];
  const statuses = ["TO DO", "IN PROGRESS", "DONE"];
  const categories = ["WORK", "HOME", "LEARNING"];
  const isValid = require("date-fns/isValid");
  const result = isValid(new Date(`${request.query.date}`));
  //const { search_q = "", status, priority } = request.query;
  switch (true) {
    case request.query.priority !== undefined &&
      request.query.status !== undefined:
      const getTodoQuery = `SELECT * FROM todo WHERE status = '${request.query.status}' AND priority = '${request.query.priority}';`;
      const data = await db.all(getTodoQuery);
      for (let todo of data) {
        const output = resultantQuery(todo);
        res.push(output);
      }
      response.send(res);
      break;
    case request.query.status !== undefined:
      if (statuses.includes(request.query.status)) {
        const getTodoQuery = `SELECT * FROM todo WHERE status = '${request.query.status}';`;
        const data = await db.all(getTodoQuery);
        for (let todo of data) {
          const output = resultantQuery(todo);
          res.push(output);
        }
        response.send(res);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case request.query.priority !== undefined:
      if (priorities.includes(request.query.priority)) {
        const getTodoQuery = `SELECT * FROM todo WHERE priority = '${request.query.priority}';`;
        const data = await db.all(getTodoQuery);
        for (let todo of data) {
          const output = resultantQuery(todo);
          res.push(output);
        }
        response.send(res);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case request.query.search_q !== undefined:
      const getTodo = `SELECT * FROM todo WHERE todo LIKE '%${request.query.search_q}%';`;
      const data1 = await db.all(getTodo);
      for (let todo of data1) {
        const output = resultantQuery(todo);
        res.push(output);
      }
      response.send(res);
      break;
    case request.query.category !== undefined &&
      request.query.status !== undefined:
      const getTodos = `SELECT * FROM todo WHERE category='${request.query.category}' AND status='${request.query.status}';`;
      const data2 = await db.all(getTodos);
      for (let todo of data2) {
        const output = resultantQuery(todo);
        res.push(output);
      }
      response.send(res);
      break;
    case request.query.category !== undefined:
      if (categories.includes(request.query.category)) {
        const getTodoQuery = `SELECT * FROM todo WHERE category='${request.query.category}';`;
        const data = await db.all(getTodoQuery);
        for (let todo of data) {
          const output = resultantQuery(todo);
          res.push(output);
        }
        response.send(res);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case request.query.category !== undefined &&
      request.query.priority !== undefined:
      const getTodosList = `SELECT * FROM todo WHERE category='${request.query.category}' AND priority='${request.query.status}';`;
      const data3 = await db.all(getTodosList);
      for (let todo of data3) {
        const output = resultantQuery(todo);
        res.push(output);
      }
      response.send(res);
      break;
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `SELECT * FROM todo WHERE id=${todoId};`;
  const data = await db.get(getTodo);
  response.send(resultantQuery(data));
});

app.get("/agenda/", async (request, response) => {
  const isValid = require("date-fns/isValid");
  const result = isValid(new Date(`${request.query.date}`));
  if (result) {
    const getTodo = `SELECT * FROM todo WHERE due_date ='${request.query.date}';`;
    const data = await db.all(getTodo);
    const res = [];
    for (let todo of data) {
      const output = resultantQuery(todo);
      console.log(output);
      res.push(output);
    }
    response.send(res);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const priorities = ["HIGH", "MEDIUM", "LOW"];
  const statuses = ["TO DO", "IN PROGRESS", "DONE"];
  const categories = ["WORK", "HOME", "LEARNING"];
  const isValid = require("date-fns/isValid");
  const res = isValid(new Date(`${request.body.dueDate}`));
  if (!statuses.includes(request.body.status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (!priorities.includes(request.body.priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!categories.includes(request.body.category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (!res) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const createTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date) 
    VALUES(${request.body.id},'${request.body.todo}','${request.body.priority}','${request.body.status}','${request.body.category}','${request.body.dueDate}');`;
    await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const isValid = require("date-fns/isValid");
  const priorities = ["HIGH", "MEDIUM", "LOW"];
  const statuses = ["TO DO", "IN PROGRESS", "DONE"];
  const categories = ["WORK", "HOME", "LEARNING"];
  switch (true) {
    case request.body.status !== undefined:
      if (statuses.includes(request.body.status)) {
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case request.body.priority !== undefined:
      if (priorities.includes(request.body.priority)) {
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case request.body.category !== undefined:
      if (categories.includes(request.body.category)) {
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case request.body.dueDate !== undefined:
      const result = isValid(new Date(`${request.body.dueDate}`));
      if (result) {
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    case request.body.todo !== undefined:
      response.send("Todo Updated");
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId} AND (status="TO DO" OR status="DONE" OR status="IN PROGRESS") AND (priority="HIGH" OR priority="LOW" OR priority="MEDIUM")
AND (category="HOME" or category="LEARNING" OR category="WORK");`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    due_date = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${due_date}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const deleteTodoQuery = `DELETE FROM todo WHERE id=${request.params.todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
