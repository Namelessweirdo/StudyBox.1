// Required for email sending
const nodemailer = require('nodemailer');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other service you use
    auth: {
        user: 'silasdarko2023@gmail.com',  // Your email
        pass: 'mplk ydvc xjvm tgzo'   // Your email password
    }
});

// Helper function to format bytes into a readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

var express = require("express");
var app = express();
var path = require("path"); // To handle file paths
var fileSystem = require("fs"); // File system module for handling files
var mime = require('mime-types'); // For detecting file MIME types

// Ensure the 'uploads' directory exists
var uploadDir = path.join(__dirname, "uploads");
if (!fileSystem.existsSync(uploadDir)) {
    fileSystem.mkdirSync(uploadDir, { recursive: true });
}

// express formidable is used to parse the form data values
var formidable = require("express-formidable");
app.use(formidable());

// use mongo DB as database
var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId; // Include this here to use ObjectId

// receiving http requests
var httpObj = require("http");
var http = httpObj.createServer(app);

// to encrypt/decrypt passwords
var bcrypt = require("bcryptjs");

// to start the session
var session = require("express-session");
app.use(session({
    secret: 'secret key',
    resave: false,
    saveUninitialized: false
}));

app.use(function (req, res, next) {
    if (req.session.user) {
        // Query to count unread notifications for the logged-in user
        database.collection("notifications").countDocuments({
            userId: req.session.user._id,
            isRead: false
        }, function (err, count) {
            if (err) {
                console.error("Error fetching notification count:", err);
            }
            // Store the unread notification count in the request object
            req.unreadNotificationsCount = count || 0;
            next();
        });
    } else {
        req.unreadNotificationsCount = 0;
        next();
    }
});

// Logout route (GET)
app.get("/Logout", function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.error("Error logging out:", err);
            return res.status(500).send("Error logging out");
        }
        res.redirect("/Login");
    });
});

// Middleware to check if user is logged in
function checkLogin(req, res, next) {
    if (req.isLogin) {
        next(); // If user is logged in, proceed to the requested route
    } else {
        res.redirect("/Login"); // If not logged in, redirect to the login page
    }
}

// define the publicly accessible folders
app.use("/public/css", express.static(__dirname + "/public/css"));
app.use("/public/js", express.static(__dirname + "/public/js"));
app.use("/public/img", express.static(__dirname + "/public/img"));
app.use("/public/font-awesome-4.7.0", express.static(__dirname + "/public/font-awesome-4.7.0"));
app.use("/public/fonts", express.static(__dirname + "/public/fonts"));

// using EJS as templating engine
app.set("view engine", "ejs");

// main URL of website
var mainURL = "http://localhost:3000";

// global database object
var database = null;

// app middleware to attach main URL and user object with each request
app.use(function (req, res, next) {
    req.mainURL = mainURL;
    req.isLogin = (typeof req.session.user !== "undefined");
    req.user = req.session.user;

    next();
});

// MongoDB connection
mongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true }, function (error, client) {
    if (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }

    database = client.db("file_transfer");
    console.log("Connected to the database.");

    http.listen(3000, function () {
        console.log("Server started at " + mainURL);
    });
});

// Home route (Landing Page)
app.get("/", function (req, res) {
    // Render the home page, whether user is logged in or not
    res.render("home", {
        request: req,  // Pass the request object to the view
        unreadNotificationsCount: req.unreadNotificationsCount || 0  // Handle the unread notifications count
    });

});

// MyUploads route
app.get("/MyUploads", checkLogin, function (req, res) {
    database.collection("uploads").find({ userId: req.user ? req.user._id : null }).toArray(function (error, uploads) {
        if (error) {
            console.error("Error fetching uploads:", error);
            res.status(500).send("Server error");
        } else {
            console.log(uploads); // Add this to check if _id is properly set
            res.render("MyUploads", {
                "request": req,
                "uploaded": uploads
            });
        }
    });
});

// AllUploads route
app.get("/AllUploads", checkLogin, function (req, res) {
    database.collection("uploads").find({}).toArray(function (error, uploads) {
        if (error) {
            console.error("Error fetching all uploads:", error);
            res.status(500).send("Server error");
        } else {
            res.render("AllUploads", {
                "request": req,
                "uploads": uploads
            });
        }
    });
});

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Search route (GET)
app.get("/Search", checkLogin, function (req, res) {
    var searchTerm = req.query.search || "";

    if (!searchTerm.trim()) {
        // If empty, redirect back or show a message
        return res.render("search", {
            "request": req,
            "files": [], // No files
            "months": months,  // Ensure months array is passed
            "formatBytes": formatBytes, // Ensure formatBytes function is passed
            "error": "Please enter a search term."
        });
    }

    database.collection("uploads").find({
        $or: [
            { fileName: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
        ]
    }).toArray(function (error, files) {
        if (error) {
            console.error("Error searching files:", error);
            res.status(500).send("Server error");
        } else {
            res.render("search", {
                "request": req,
                "files": files,  // Files found during the search
                "months": months,  // Pass months array to EJS template
                "formatBytes": formatBytes, // Pass formatBytes to format file sizes
                "error": null // No error message if search is successful
            });
        }
    });
});

// Helper function to format file sizes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Login route (GET)
app.get("/Login", function (req, res) {
    res.render("login", { "request": req });
});


// Login route (POST)
app.post("/Login", function (req, res) {
    var email = req.fields.email;
    var password = req.fields.password;

    database.collection("users").findOne({ email: email }, function (error, user) {
        if (error || !user) {
            res.status(401).send("Invalid email or password");
            return;
        }

        bcrypt.compare(password, user.password, function (err, result) {
            if (result) {
                req.session.user = user;
                res.redirect("/MyUploads");
            } else {
                res.status(401).send("Invalid email or password");
            }
        });
    });
});

// Register route (GET)
app.get("/Register", function (req, res) {
    res.render("register", { "request": req });
});

// Download file route
app.get('/DownloadFile/:id', function (req, res) {
    var fileId = req.params.id;

    // Check if the fileId is a valid ObjectId
    if (!ObjectId.isValid(fileId)) {
        console.error("Invalid file ID:", fileId);
        return res.status(400).send("Invalid file ID");
    }

    fileId = new ObjectId(fileId); // Convert to ObjectId

    database.collection('uploads').findOne({ _id: fileId }, function (error, file) {
        if (error || !file) {
            return res.status(404).send('File not found.');
        }

        var filePath = path.join(__dirname, "uploads", file.fileName);

        fileSystem.stat(filePath, function (err, stat) {
            if (err) {
                return res.status(404).send('File not found.');
            }

            res.download(filePath, file.fileName, function (err) {
                if (err) {
                    console.error('File download error:', err);
                    res.status(500).send('Could not download the file.');
                }
            });
        });
    });
});

// View file route
app.get('/ViewFile/:id', function (req, res) {
    var fileId = req.params.id;

    // Check if the fileId is a valid ObjectId
    if (!ObjectId.isValid(fileId)) {
        console.error("Invalid file ID:", fileId);
        return res.status(400).send("Invalid file ID");
    }

    fileId = new ObjectId(fileId); // Convert to ObjectId

    database.collection('uploads').findOne({ _id: fileId }, function (error, file) {
        if (error || !file) {
            return res.status(404).send('File not found.');
        }

        var filePath = path.join(__dirname, "uploads", file.fileName);
        var fileExtension = path.extname(file.fileName).toLowerCase();

        if (fileExtension === ".docx" || fileExtension === ".xls" || fileExtension === ".xlsx") {
            // Render the 'viewNotSupported' page for unsupported file types
            res.render("viewNotSupported", {
                request: req,
                fileName: file.fileName,
                filePath: filePath
            });
        } else {
            var fileMime = mime.lookup(file.fileName);
            res.setHeader("Content-Type", fileMime);
            res.setHeader("Content-Disposition", "inline");

            res.sendFile(filePath, function (err) {
                if (err) {
                    console.error("Error sending file:", err);
                    res.status(500).send("Error opening the file.");
                }
            });
        }
    });
});

// SharedWithMe route
app.get("/SharedWithMe", checkLogin, function (req, res) {
    const userId = req.user._id;  // Get the logged-in user's ID

    // Find all files shared with the current user
    database.collection("shared_links").aggregate([
        {
            $match: { sharedWith: ObjectId(userId) }  // Only match files shared with the logged-in user
        },
        {
            $lookup: {
                from: "uploads",  // Collection with file details
                localField: "fileId",
                foreignField: "_id",
                as: "sharedFiles"
            }
        },
        { $unwind: "$sharedFiles" }  // Flatten the array to display one file per entry
    ]).toArray(function (error, sharedFiles) {
        if (error) {
            console.error("Error fetching shared files:", error);
            return res.status(500).send("Server error.");
        }

        // Render the shared files to the view
        res.render("SharedWithMe", {
            "request": req,
            "sharedFiles": sharedFiles  // Pass the shared files to the template
        });
    });
});

// Upload file route
app.post("/UploadFile", function (req, res) {
    if (!req.isLogin) {
        return res.status(403).send("Unauthorized");
    }

    var file = req.files.file;  // This is the uploaded file

    // Check if the file is uploaded correctly
    if (!file) {
        return res.status(400).send("No file uploaded.");
    }

    // Define the path to store the file in the 'uploads' directory
    var filePath = path.join(__dirname, "uploads", file.name);

    // Save the file to the uploads directory
    fileSystem.rename(file.path, filePath, function (error) {
        if (error) {
            console.error("Error saving file:", error);
            return res.status(500).send("Error saving file.");
        }

        // Insert file information into the database
        database.collection("uploads").insertOne({
            userId: req.user._id,
            fileName: file.name, // Store the uploaded file name
            fileSize: file.size,
            uploadDate: new Date(),
            description: req.fields.description || "" // Optional description
        }, function (error, result) {
            if (error) {
                return res.status(500).send("Error saving file to database.");
            }
            res.redirect("/MyUploads");
        });
    });
});

// Register route (POST)
app.post("/Register", function (req, res) {
    var name = req.fields.name;
    var email = req.fields.email;
    var password = req.fields.password;

    // Check if the email is already registered
    database.collection("users").findOne({ email: email }, function (error, user) {
        if (user) {
            // Email is already registered
            return res.status(400).send("Email is already registered.");
        }

        // Hash the password
        bcrypt.hash(password, 10, function (err, hash) {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).send("Error registering user.");
            }

            // Insert the new user into the database
            database.collection("users").insertOne({
                name: name,
                email: email,
                password: hash, // Store the hashed password
                createdAt: new Date()
            }, function (error, result) {
                if (error) {
                    console.error("Error registering user:", error);
                    return res.status(500).send("Error registering user.");
                }

                // Registration successful
                res.redirect("/Login");
            });
        });
    });
});

// Delete file route (POST or DELETE)
app.post('/DeleteFile', function (req, res) {
    var fileId;

    // Validate and convert the fileId to an ObjectId
    try {
        fileId = ObjectId(req.fields._id);
    } catch (err) {
        return res.status(400).send("Invalid file ID.");
    }

    // Find the file by its ID
    database.collection('uploads').findOne({ _id: fileId }, function (error, file) {
        if (error || !file) {
            return res.status(404).send('File not found.');
        }

        var filePath = path.join(__dirname, "uploads", file.fileName);

        // Remove the file from the filesystem
        fileSystem.unlink(filePath, function (err) {
            if (err) {
                console.error("Error deleting file:", err);
                return res.status(500).send("Error deleting file.");
            }

            // Remove the file record from the database
            database.collection('uploads').deleteOne({ _id: fileId }, function (error) {
                if (error) {
                    console.error("Error deleting file record from database:", error);
                    return res.status(500).send("Error deleting file.");
                }

                // Redirect back to MyUploads after successful deletion
                res.redirect('/MyUploads');
            });
        });
    });
});

// Function to format file sizes in a readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ShareFile route with email notification and database notification creation
app.post("/ShareFile", checkLogin, function (req, res) {
    var fileId = req.fields.fileId;
    var recipientEmail = req.fields.recipientEmail;

    // Validate file ID
    try {
        fileId = ObjectId(fileId);
    } catch (err) {
        return res.status(400).send("Invalid file ID.");
    }

    // Check if the file exists and is owned by the current user
    database.collection("uploads").findOne({ _id: fileId, userId: req.user._id }, function (error, file) {
        if (error || !file) {
            return res.status(404).send("File not found or you don't have permission to share this file.");
        }

        // Find the recipient by their email to get the ObjectId
        database.collection("users").findOne({ email: recipientEmail }, function (error, recipient) {
            if (error || !recipient) {
                return res.status(404).send("Recipient not found.");
            }

            // Check if the file is already shared with this user
            database.collection("shared_links").findOne({ fileId: fileId, sharedWith: recipient._id }, function (error, existingShare) {
                if (existingShare) {
                    return res.status(400).send("File already shared with this user.");
                }

                // Prepare the shared file document
                const sharedFile = {
                    fileId: fileId,
                    sharedBy: ObjectId(req.user._id),  // Current logged-in user's ObjectId
                    sharedWith: ObjectId(recipient._id),  // Recipient's ObjectId
                    sharedAt: new Date()  // Timestamp of when the file was shared
                };

                // Insert into the shared_links collection
                database.collection("shared_links").insertOne(sharedFile, function (error, response) {
                    if (error) {
                        return res.status(500).send("Error sharing the file.");
                    }

                    // Insert notification for the recipient (No manually set _id)
                    const notification = {
                        userId: ObjectId(recipient._id),
                        message: `A file titled '${file.fileName}' was shared with you.`,
                        isRead: false,
                        createdAt: new Date()
                    };

                    // Add notification to the notifications collection
                    database.collection("notifications").insertOne(notification, function (err, result) {
                        if (err) {
                            console.error("Error creating notification:", err);
                        }

                        // Send Email Notification
                        const mailOptions = {
                            from: 'your-email@gmail.com',  // Your email
                            to: recipientEmail,            // Recipient's email
                            subject: 'File Shared with You',
                            text: `A file titled "${file.fileName}" has been shared with you by ${req.user.name}. You can access it in your Shared With Me section.`
                        };

                        transporter.sendMail(mailOptions, function (err, info) {
                            if (err) {
                                console.error("Error sending email:", err);
                                return res.status(500).send("File shared, but error sending email notification.");
                            }

                            // After sharing the file, redirect back to MyUploads with success message
                            res.redirect("/MyUploads");
                        });
                    });
                });
            });
        });
    });
});

// View shared file route (GET)
app.get("/ViewSharedFile/:fileId", checkLogin, function (req, res) {
    var fileId;

    // Validate file ID
    try {
        fileId = ObjectId(req.params.fileId);
        console.log("Requested file ID:", fileId);  // Debug: Log the file ID
    } catch (err) {
        return res.status(400).send("Invalid file ID.");
    }

    // Check if the file is shared with the current user
    database.collection("shared_links").findOne({ fileId: fileId, sharedWith: req.user._id }, function (error, sharedFile) {
        if (error) {
            console.error("Error fetching shared link:", error);
            return res.status(500).send("Server error.");
        }

        if (!sharedFile) {
            console.log("No shared link found for this file and user combination.");
            console.log("Logged in user ID:", req.user._id);
            return res.status(403).send("You do not have access to this file.");
        }

        // Find the file in the uploads collection
        database.collection("uploads").findOne({ _id: fileId }, function (error, file) {
            if (error) {
                console.error("Error fetching file:", error);
                return res.status(500).send("Server error.");
            }

            if (!file) {
                console.log("File not found in uploads collection.");
                return res.status(404).send("File not found.");
            }

            var filePath = path.join(__dirname, "uploads", file.fileName);
            console.log("File path:", filePath);  // Debug: Log the file path

            // Display the file
            res.sendFile(filePath, function (err) {
                if (err) {
                    console.error("Error sending file:", err);
                    return res.status(500).send("Error opening the file.");
                }
            });
        });
    });
});

app.get("/Notifications", checkLogin, function (req, res) {
    // Fetch notifications for the logged-in user
    database.collection("notifications").find({ userId: req.user._id }).toArray(function (err, notifications) {
        if (err) {
            console.error("Error fetching notifications:", err);
            return res.status(500).send("Server error.");
        }

        // Render the notifications page
        res.render("notifications", {
            request: req,
            notifications: notifications  // Pass notifications to the view
        });

        // Mark notifications as read once they're viewed
        database.collection("notifications").updateMany(
            { userId: req.user._id, isRead: false },
            { $set: { isRead: true } },
            function (err) {
                if (err) {
                    console.error("Error marking notifications as read:", err);
                }
            }
        );
    });
});

app.post("/MarkNotificationRead/:id", checkLogin, function (req, res) {
    const notificationId = req.params.id;
    try {
        database.collection("notifications").updateOne(
            { _id: ObjectId(notificationId) },
            { $set: { isRead: true } },
            function (error) {
                if (error) {
                    return res.status(500).send("Error marking notification as read.");
                }
                res.redirect("/Notifications");
            }
        );
    } catch (err) {
        res.status(400).send("Invalid notification ID.");
    }
});

// Middleware to check if user is logged in
function checkLogin(req, res, next) {
    if (req.session.user) {
        next(); // Proceed to the requested route if logged in
    } else {
        if (req.path === "/" || req.path === "/Login" || req.path === "/Register") {
            // Allow access to home, login, and register routes without logging in
            next();
        } else {
            // Redirect to login if trying to access a protected page
            res.redirect("/Login");
        }
    }
}

