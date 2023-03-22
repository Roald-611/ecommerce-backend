const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');

/* GET all products */
router.get('/', function(req, res) {
  let page = (req.query.page !== undefined && req.query.page !== 0)?req.query.page:1;
  const limit = (req.query.limit !== undefined && req.query.limit !== 0)?req.query.limit:10;

  let startValue = 0;
  let endValue = 10;

  if (page > 0){
    startValue = (page * limit ) - limit; //0,10,20,30,...
    endValue = page * limit;
  }

database.table('products as p')
    .join([{
        table:'categories as c',
        on:'c.id = p.cat_id'
    }])
    .withFields([
        'c.title as category',
        'p.title as name',
        'p.price',
        'p.quantity',
        'p.description',
        'p.image',
        'p.id'
    ])
    .slice(startValue,endValue)
    .sort({id:1})
    .getAll()
    .then(prods => {
      if (prods.length > 0){
        res.status(200).json({
          count:prods.length,
          products:prods
        });
      }else{
        res.json({message:'No Products Found!'})
      }
    }).catch(err=>console.log(err))
});

/* GET Any product By ProdID */
router.get('/:prodId',(req,res)=>{
  const prodId = req.params.prodId;
  database.table('products as p')
      .join([{
        table:'categories as c',
        on:'c.id = p.cat_id'
      }])
      .withFields([
        'c.title as category',
        'p.title as name',
        'p.price',
        'p.quantity',
        'p.description',
        'p.image',
        'p.images',
        'p.id'
      ])
      .filter({'p.id':prodId})
      .get()
      .then(prod => {
        if (prod){
          res.status(200).json(prod);
        }else{
          res.json({message:`No Product Found With Product ID :- ${prodId} !`})
        }
      }).catch(err=>console.log(err))
})

/* GET ALL Same Category Products */
router.get('/category/:catName',(req,res)=>{
  let page = (req.query.page !== undefined && req.query.page !== 0)?req.query.page:1;
  const limit = (req.query.limit !== undefined && req.query.limit !== 0)?req.query.limit:10;
  const catName = req.params.catName;

  let startValue = 0;
  let endValue = 10;

  if (page > 0){
    startValue = (page * limit ) - limit; //0,10,20,30,...
    endValue = page * limit;
  }

  database.table('products as p')
      .join([{
        table:'categories as c',
        on:`c.id = p.cat_id WHERE c.title LIKE '%${catName}%'`
      }])
      .withFields([
        'c.title as category',
        'p.title as name',
        'p.price',
        'p.quantity',
          'p.description',
        'p.image',
        'p.id'
      ])
      .slice(startValue,endValue)
      .sort({id:1})
      .getAll()
      .then(prods => {
        if (prods.length > 0){
          res.status(200).json({
            count:prods.length,
            products:prods
          });
        }else{
          res.json({message:`No Products Found For Category :- ${catName} !`})
        }
      }).catch(err=>console.log(err))
})

module.exports = router;
