const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide name'],
        minLength: 6,
        maxLength: 20,
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        validate:{
            validator: validator.isEmail,
            message: 'Please provide email'
        },
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minLength: 6,
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
    },
    verificationToken: String,
    isVerified: {
        type: Boolean,
        default: false,
    },
    verified: Date,
    passwordToken: {
        type: String,
    },
    passwordTokenExpirationDate: {
        type: Date
    }
})

// here function() points back to the use and that's not a case with arrow function
// run before saving the document
// below lines of code will hash the  password using mongoose middleware
UserSchema.pre('save',async function () {
    // if password is not modified then no need to again save the password after hashing
    if(!this.isModified('password')) return;
    const salt = await bcrypt.genSalt (10)
    this.password  = await bcrypt.hash(this.password,salt)
})

// UserSchema.methods.createJWT = function() {
//     return jwt.sign({userId:this._id, name: this.name, role: this.role}, process.env.JWT_SECRET, {
//         expiresIn: process.env.JWT_LIFETIME
//     })
// }

// check if password match
UserSchema.methods.comparePassword = async function (candidatePassword){
    const isMatch = await bcrypt.compare(candidatePassword, this.password)
    return isMatch
}




module.exports = mongoose.model('User',UserSchema)