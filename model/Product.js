const mongoose = require('mongoose')

const ProductSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'Please provide product name'],
        maxlength: [1000, 'Name can not be more than 100 characters'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide product price'],
        default: 0,    
    },
    description: {
        type: String,
        required: [true, 'Please provide product description'],
        maxlength: [1000, 'Description can not be more than 1000 characters'],
    },
    image: {
        type:String,
        default: '/uploads/example'
    },
    category: {
        type: String,
        required: [true, 'Please provide product category'],
        enum: ['office', 'kitchen', 'bedroom'],
    },
    company: {
        type: String,
        required: [true, 'Please provide product company'],
        enum: {
            values:['ikea', 'liddy', 'marcos'],
            message: '{VALUE} is not supported',
        },
    },
    colors: {
        type: [String],
        default: ['#222'],
        required: true,
    },
    featured: {
        type: Boolean,
        required: false,
    },
    freeShipping: {
        type: Boolean,
        required: false,
    },
    inventory: {
        type: Number,
        required: true,
        default: 15,
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
    },   
}, {timestamps: true, toJSON: {virtuals: true}, toObject:{virtuals: true}}
)

ProductSchema.virtual('reviews',{
    ref: 'Review',
    localField: '_id',
    foreignField: 'product',
    justOne: false,
    // match: {rating: 5} // to get review with rating 5 only
});

// will be called before await product.deleteOne() is called
ProductSchema.pre('deleteOne', { document: true, query: false }, async function(){
    // delete from Reveiw schema where product is equal to current product id for which this middleware is called
    await this.model('Review').deleteMany({product: this._id})
    console.log('here')
})

module.exports = mongoose.model('Product', ProductSchema)