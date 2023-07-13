const express = require('express')
const router = express.Router()
const {authorizePermission} = require('../middleware/authentication')

const {
    getAllOrders,
    getSingleOrder,
    getCurrentUserOrders,
    createOrder,
    updateOrder,
} = require('../controller/orderController')


router
    .route('/')
    .post(createOrder)
    .get(authorizePermission('admin'),getAllOrders)
router
    .route('/showAllMyOrders')
    .get(getCurrentUserOrders)
router
    .route('/:id')
    .get(getSingleOrder)
    .patch(updateOrder)

module.exports = router