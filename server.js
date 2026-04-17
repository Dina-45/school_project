const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();


app.use(express.json());


app.use(cors());



const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    filePath: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
  });
});

app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public/uploads', req.params.filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});


let courses = [
  { id: 1, title: "Math", classId: 1 },
  { id: 2, title: "Physics", classId: 2 }
];


app.get('/courses', (req, res) => {
  res.json(courses);
});


app.post('/courses', (req, res) => {
  const newCourse = {
    id: Date.now(),
    ...req.body
  };
  courses.push(newCourse);
  res.json(newCourse);
});


app.delete('/courses/:id', (req, res) => {
  courses = courses.filter(c => c.id != req.params.id);
  res.json({ success: true });
});


app.put('/courses/:id', (req, res) => {
  courses = courses.map(c =>
    c.id == req.params.id ? { ...c, ...req.body } : c
  );
  res.json({ success: true });
});



app.listen(3002, () =>
  console.log('Server running on http://localhost:3002')
);