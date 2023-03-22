const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');
const {log} = require("debug");

/* GET All Orders */
router.get('/orders', function(req, res) {
  database.table('orders_details as od').join([
      {
        table:'orders as o',
        on:'o.id = od.order_id'
      },{
    table: 'products as p',
      on: 'p.id = od.product_id'
    },{
    table: 'users as u',
      on:'u.id = o.user_id'
    }
  ])
      .withFields(['o.id','p.title as name','p.description','p.price','u.username'])
      .sort({id:1})
      .getAll()
      .then(orders => {
        if (orders.length>0){
          res.status(200).json(orders);
        }else{
          res.json({message: 'No Orders Found!'});
        }
      }).catch(err=>console.log(err));
});

// GET single Order By Order Id
router.get('/:orderId',(req,res)=>{
    const orderId = req.params.orderId;

    database.table('orders_details as od').join([
        {
            table:'orders as o',
            on:'o.id = od.order_id'
        },{
            table: 'products as p',
            on: 'p.id = od.product_id'
        },{
            table: 'users as u',
            on:'u.id = o.user_id'
        }
    ])
        .withFields(['o.id','p.title as name','p.description','p.price','u.username','p.image','od.quantity as quantityOrdered'])
        .filter({'o.id':orderId})
        .getAll()
        .then(orders => {
            if (orders.length>0){
                res.status(200).json(orders);
            }else{
                res.json({message: `No Order Found For OrderID :- ${orderId}!`});
            }
        }).catch(err=>console.log(err));
});

// INSERT NEW ORDER
router.post('/',(req,res)=>{
    const {userId,products} = req.body;
    if (userId !== null && userId > 0 && !isNaN(userId)){
        database.table('orders').insert({
            user_id:userId
        }).then(newOrderId=>{
            newOrderId = newOrderId.insertId-31;
            let acceptQuantity = true;
            const fallBackStoke = [];
            if (newOrderId > 0){
                products.forEach(async (p)=>{
                    let data = await database.table('products').filter({id:p.id}).withFields(['quantity','title']).get();
                    let inCart = p.incart;

                    const reqQuantity = data.quantity - inCart;
                    console.log("reqQuantity",reqQuantity)
                    if (reqQuantity >= 0){
                        acceptQuantity = true;
                        console.log('here')
                        // Deduct the number of pieces from the quantity column in database
                        if (data.quantity > 0){
                            data.quantity = data.quantity - inCart;
                            if (data.quantity < 0){
                                data.quantity = 0
                            }
                        }else{
                            data.quantity = 0
                        }
                    }else{
                        acceptQuantity = false;
                        fallBackStoke.push({name:data.title,quantity:data.quantity})
                        console.log(fallBackStoke)
                    }
                    console.log("acceptQuantity",acceptQuantity)
                    if (acceptQuantity){
                        //Insert Order Details WRT The New Generated Order Id

                        database.table('orders_details').insert({
                            order_id:newOrderId,
                            product_id:p.id,
                            quantity:inCart
                        }).then(newId=>{
                            database.table('products').filter({id:p.id}).update({
                                quantity:data.quantity
                            }).then(successNum =>{
                                console.log('Quantity Updated Successfully!')
                            }).catch(err=>console.log(err));
                        }).catch(err=>console.log(err));
                    }
                })
            }else{
                return res.json({message:'New Order Failed While Adding Order Details!',succecc:false})
            }

            setTimeout(()=>{
                if(fallBackStoke.length){
                    return res.json({
                        message:`Sorry,We have not Sufficient Stoke For ${fallBackStoke.length} ${fallBackStoke.length === 1?'Product':'Products'}${(products.length-fallBackStoke.length > 1) ? `, We Place Order For Other Products With Order Id ${newOrderId}`: (products.length-fallBackStoke.length > 0) ?`, We Place Order For Other Product With Order Id ${newOrderId}` : ''} !`,
                        product:fallBackStoke,
                        order_id:newOrderId,
                        succecc:false
                    });
                }
                return res.json({
                    message:`Order Successfully Placed With Order Id ${newOrderId}`,
                    success:true,
                    order_id:newOrderId,
                    products:products
                });
            },1000)
        }).catch(err=>console.log(err))
    }else{
        res.json({message:'New Order Failed!',success:false});
    }
});

// Fake Payment Route
router.post('/payment',(req,res)=>{
    setTimeout(()=>{
        res.status(200).json({success:true});
    },3000);
});

module.exports = router;
