const app = require('../../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chaiHttp.expect;
const { Model } = require('objection');


const { dbConnect, dbDisconnect, dbGet } = require('../../db');
const User = require('../../models/user');

describe('Users endpoint', function(){

  before(function(){
    
    return dbConnect()
      .then(() => {
        const knex = dbGet();
        Model.knex(knex);
      });
  });

  after(function(){
    return dbDisconnect();
  });

});