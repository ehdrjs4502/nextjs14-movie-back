// dotenv 라이브러리 로드
require("dotenv").config();

// 환경 변수에서 데이터베이스 연결 정보 가져오기
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbDatabase = process.env.DB_DATABASE;
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const cors = require("cors"); // CORS 미들웨어 추가

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors()); // 모든 origin에 대해 CORS 허용

// MySQL 연결 설정
const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase,
});

// 회원가입 API
app.post("/signup", async (req, res) => {
  const { username, id, password } = req.body;
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query("INSERT INTO users (user_name, user_id, password) VALUES (?, ?, ?)", [
      username,
      id,
      password,
    ]);
    connection.release();
    res.status(200).json({ message: "User signed up successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Failed to sign up user" });
  }
});

// 로그인 API
app.post("/login", async (req, res) => {
  const { id, password } = req.body;
  console.log(req.body);
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT * FROM users WHERE user_id = ? AND password = ?", [id, password]);
    connection.release();
    console.log(rows);
    if (rows.length > 0) {
      res.status(200).json({ id });
      console.log("success");
    } else {
      res.status(401).json({ message: "Invalid credentials" });
      console.log("Invalid");
    }
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

// 영화 찜하기 API
app.post("/favorites", async (req, res) => {
  const { userID, movieID, title, postURL } = req.body;
  try {
    const connection = await pool.getConnection();
    const [userRows] = await connection.query("SELECT id FROM users WHERE user_id = ?", [userID]);
    const userIDFromUsersTable = userRows[0].id;

    await connection.query("INSERT INTO favorites (user_id, movie_id, movie_title, post_url) VALUES (?, ?, ?, ?)", [
      userIDFromUsersTable,
      movieID,
      title,
      postURL,
    ]);
    connection.release();
    res.status(200).json({ message: "Movie added to favorites successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Failed to add movie to favorites" });
  }
});

// 영화 찜하기 삭제 API
app.delete("/favorites", async (req, res) => {
  const { userID, movieID } = req.body;
  try {
    const connection = await pool.getConnection();

    // 사용자 ID로 사용자의 데이터를 가져옵니다.
    const [userRows] = await connection.query("SELECT id FROM users WHERE user_id = ?", [userID]);
    const userIDFromUsersTable = userRows[0].id;

    // 사용자 ID와 영화 ID를 사용하여 favorites 테이블에서 해당 영화를 삭제합니다.
    await connection.query("DELETE FROM favorites WHERE user_id = ? AND movie_id = ?", [userIDFromUsersTable, movieID]);

    connection.release();
    res.status(200).json({ message: "Movie removed from favorites successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Failed to remove movie from favorites" });
  }
});

// 찜한 영화 목록 조회 API
app.get("/favorites/:userID", async (req, res) => {
  const userID = req.params.userID;
  try {
    const connection = await pool.getConnection();
    const [userRows] = await connection.query("SELECT id FROM users WHERE user_id = ?", [userID]);
    const userIDFromUsersTable = userRows[0].id;

    const [rows] = await connection.query("SELECT * FROM favorites WHERE user_id = ?", [userIDFromUsersTable]);
    connection.release();
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Failed to fetch favorites" });
  }
});

app.get("/testSelect", async (req, res) => {
  const connection = await pool.getConnection();
  const [rows] = await connection.query("SELECT * FROM users");
  console.log(rows);
  connection.release();
  res.status(200).json(rows);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
