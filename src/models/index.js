const sequelize = 	require('../config/database');
const User = 		require('./User');
const Category = 	require('./Category');
const Product = 	require('./Product');
const Order = 		require('./Order');
const OrderItem = 	require('./OrderItem');
const Delivery =	require('./Delivery');


//relacxion 1:N un usuario puede tener muchos pedidos
User.hasMany(Order, { foreingKey: 'userID', as: 'orders'});
Order.belongsTo(User, { foreingKey: 'userID', as: 'user'});

//relacion 1:N una categoria contiene muchos  productos 
Category.hasMany(Product,  { foreingKey: 'categoryId', as: 'products'});
Product.belongsTo(Category, { foreingKey: 'categoryId', as: 'category'});

//relacion N:M producto aparecer en muchos itemns de orden
Product.hasMany(OrderItem,  { foreingKey: 'productId', as: 'products'});
OrderItem.belongsTo(Product, { foreingKey: 'productId', as: 'category'});

//relacion de entrega 1:1 
Order.hasMany(Delivery,  { foreingKey: 'orderId', as: 'delivery'});
Delivery.belongsTo(Order, { foreingKey: 'orderId', as: 'order'});

//exportar todo
module.exports={
sequelize,	
User, 		
Category,	
Product,
Order,
OrderItem, 
Delivery,
}