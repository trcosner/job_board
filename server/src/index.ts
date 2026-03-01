import express, {json} from 'express'

const app = express()

// Enable if behind reverse proxy
// app.set("trust proxy", 1); 

app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Hello, world!')
})

app.use(json());

// If using form submission from client
// app.use(urlencoded({ extended: true })); 


app.listen(3000, () => {
    console.log('Listening on port 3000')
})