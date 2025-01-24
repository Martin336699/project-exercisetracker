require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')


const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URL)

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String
})
const User = mongoose.model('User', userSchema);

const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: Date,
  user_id: String
})
const Exercise = mongoose.model('Exercise', exerciseSchema);
                 

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req, res) => {
  console.log(req.body)
  const username = req.body.username;
  const userOject = new User({username: username});
  try{
    const user = await userOject.save();
    console.log(user)
    res.json(user)
  } catch(err){
    console.log(err)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const {description, duration, date} = req.body;
  
  try{
    const user = await User.findById(id);
    if(!user) {
      res.send("Could not find user")
    } else {
      const exerciseObject = new Exercise({
        user_id: id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      })
      const exercise = await exerciseObject.save();

      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  } catch(err){
    console.log(err)
    res.send("There was an error saving the exercise")
  }
})

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users)
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const user = await User.findById(id);
  const {from, to, limit} = req.query;
  if(!user) {
    res.send("Could not find user")
    return;
  }
  let dateObject = {}
  
  if(from) {
    dateObject["$gte"] = new Date(from)
  }
  if(to) {
    dateObject["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if(from || to) {
    filter.date = dateObject
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }))

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log 
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
