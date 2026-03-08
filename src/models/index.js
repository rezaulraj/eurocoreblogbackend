import sequelize from "../config/db.js";

import User from "./User.js";
import Post from "./Post.js";
import Testimonial from "./Testimonial.js";
import Social from "./Social.js";
import Visitor from "./Visitor.js";
import Location from "./Location.js";
import Gallery from "./Gallery.js";
import Email from "./Email.js";
import Contact from "./Contact.js";
import Category from "./Category.js";
import Analytics from "./Analytics.js";
import Analysis from "./Analysis.js";

// Associations
User.hasMany(Post, {
  foreignKey: "authorId",
  as: "posts",
  onDelete: "CASCADE",
});

Post.belongsTo(User, {
  foreignKey: "authorId",
  as: "author",
});

export {
  sequelize,
  User,
  Post,
  Testimonial,
  Social,
  Visitor,
  Location,
  Gallery,
  Email,
  Contact,
  Category,
  Analytics,
  Analysis,
};
