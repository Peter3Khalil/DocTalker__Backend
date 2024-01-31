const { connectDB } = require('../config/database');
const Doc = require('../models/document');
const slugify = require('slugify');
const {uploadFile} = require('../services/aws');
const {deleteFile}  = require('../services/aws');
const chatmodel = require('../models/Chat');



exports.handler = async (req, res) => {

  const file = req.file
  // 1. only allow POST methods
  if (req.method !== 'POST') {
      return res.status(400).send('method not supported');
  }

  // check if the file pdf and its exist

  const currUser = req.user;
  
  const isOkayToUpload = currUser.maxUploadRequest - currUser.uploadRequest > 0;

  if(!isOkayToUpload)
  {
    return res.status(400).json({message : 'You have exceeded your upload limit'});

  } else{
    try
    {
        // 2. connect to the mongodb db
        await connectDB()
            .then(() => {
                console.log('MongoDB Connected -- uploading phase -- ');
            });

        // Check if the file object exists
        if (!file) {
            return res.status(400).json({
                error: 'No file uploaded'
            });
        }
        
        // check if the file is pdf
        if (file.mimetype !== 'application/pdf') {
            res.json({
                error: 'Only PDF files are allowed.'  
                // TODO : ADD MORE FILE TYPES
            });
        } else {

            // Check if the necessary file properties are available
            // 4. upload the file to s3
            const dataLocation = await uploadFile(file.originalname, file.buffer, file.mimetype)
                
            // 7. save file info to the mongodb db

            const myFile = new Doc({
                FileName: file.originalname,
                FileUrl: dataLocation, // aws file url
            });
            
            await myFile.save()
            .then(() => {
                
                const chat = new chatmodel({
                    documentId: myFile._id,
                    chatName: slugify(file.originalname)
                })
                
                    chat.save().then(() => {
                    
                    // Increse the upload request for the user
                    currUser.uploadRequest += 1;
                    currUser.chats.push(chat._id);
                    
                    currUser.save()
                    return res.status(200).json({
                        message: 'File uploaded to S3 and MongoDB successfully',
                        chatId: chat._id
                    });
                    
                    
                }).catch(err => {res.status(500).json({message: err.message})});
            })
            .catch((err) => {});
            // await disconnectDB()
        
        };
      

    } catch (e) {
        
        // await disconnectDB()
        return res.status(500).send({
            message: e.message,
        });
    }
    
} // end else
}