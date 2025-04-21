import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index.html");
});

app.get("/form.html", (req, res) => {
  res.render("form.html");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/register", async (req, res) => {
  const name =req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phoneNumber=req.body.phone;

  try {
    const checkResult = await db.query("SELECT * FROM customer WHERE email = $1", [
      email,
    ]);
    if (checkResult.rows.length > 0) {
      res.send(`
        <html>
          <body>
            <p>You are already registered! Go to the <a href="login_page.html">login page</a>.</p>
            <script>
              // Optional: Automatically redirect after 3 seconds if no click
              setTimeout(() => {
                window.location.href = "login_page.html";
              }, 3000); // 3 seconds
            </script>
          </body>
        </html>
      `);
    }
    
    else {
      const result = await db.query(
        "INSERT INTO customer (name,email,password,phoneNumber) VALUES ($1, $2 ,$3,$4)",
        [name,email,password,phoneNumber]
      );
      res.redirect("login_page.html");
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/add", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const type =req.body.Guitar_type;
  const address=req.body.address;  
  try {
    const result = await db.query("SELECT * FROM customer WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const customer = result.rows[0];
      const storedPassword = customer.password;
      const customer_id=customer.id;
      if (password === storedPassword) {
        const cur_date=new Date();
        const del_date = new Date(cur_date);
        del_date.setDate(cur_date.getDate() + 2);
        

        const result = await db.query(
          "INSERT INTO transactions (productname,customer_id,cur_date,del_date,address) VALUES ($1, $2 ,$3,$4,$5)",
          [type,customer_id,cur_date,del_date,address]
        );
      } else {
        res.send("Incorrect Password");
      }
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }

  res.send(`
    <html>
      <body>
        <p>Successfully added.(Redirecting you to Home Page)</p>
        <script>
          // Optional: Automatically redirect after 3 seconds if no click
          setTimeout(() => {
            window.location.href = "index.html";
          }, 4000); // 3 seconds
        </script>
      </body>
    </html>
  `);
  res.send("");
});


app.post("/show", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM customer WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const customer = result.rows[0];
      const storedPassword = customer.password;
      const customer_id=customer.id;

      if (password === storedPassword) {
        const transactionsResult = await db.query("SELECT * FROM transactions WHERE customer_id = $1", [customer_id]);

        res.render("show_n.ejs", { transactions: transactionsResult.rows });
        return;
      } else {
        res.send("Incorrect Password");
      }
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});