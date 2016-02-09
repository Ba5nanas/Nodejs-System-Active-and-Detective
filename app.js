const fs = require('fs');
const http = require('http');
const hbs = require("handlebars");
global.plugins = [];

function get_plugins_active(){
  var out = JSON.parse(fs.readFileSync("./plugins.json"));
  return out;
}

function put_plugin_active(file,response){
  var list_active = get_plugins_active();
  var item = {
    name:file,
    file:file+".js"
  };

  if(list_active.active.length > 0){
    var check = false;
    list_active.active.forEach(function(data,key){
      if(data["name"] != file){
        check = true;
        //list_active.active.push(item);
      }else{
        check = false;
      }

    });
    if(check == true){
      list_active.active.push(item);
    }
  }else{
    list_active.active.push(item);
  }

  fs.writeFileSync("./plugins.json",JSON.stringify(list_active));
  //load_plugin(file);
  reload_plugin(response);
}

function out_plugin_detactive(file,response){
  var list_active = get_plugins_active();
  remove_arrayItem(list_active.active,"name",file);
  fs.writeFileSync("./plugins.json",JSON.stringify(list_active));
  unload_plugin(file);
  reload_plugin(response);
}

function reload_plugin(response){
  var list_active = get_plugins_active();
  try {
    list_active.active.forEach(function(data){
      delete require.cache[require.resolve('./files/'+data.name+'.js')];
      delete plugins[data.name];
    });
    list_active.active.forEach(function(data){
      plugins[data.name] = require("./files/"+data.name+".js");
    });
  } catch (err) {
    response.write(err + '');
    //response.end();
  }
}

function unload_plugin(file){
  delete require.cache[require.resolve('./files/'+file+'.js')];
  delete plugins[file];
}

function load_plugin(file){
    fs.stat("./files/"+file+".js", function(err, stat) {
      if(err == null){
        plugins[file] = require("./files/"+file+".js");
      }
    });
}

function load_plugins(){
  var list_active = get_plugins_active();
  list_active.active.forEach(function(data){
    fs.stat("./files/"+data+".js", function(err, stat) {
      if(err == null){
        plugins[data] = require("./files/"+data+".js");
      }
    });
  });
}

function remove_arrayItem(array, itemToRemove, value) {
  array.forEach(function(data,key){
    if(data[itemToRemove] == value){

      array.splice(key,1);

    }
  });
}

function findIndexInData(data, property, value) {
    var result = -1;
    data.some(function (item, i) {
        if (item[property] === value) {
            result = i;
            return true;
        }
    });
    return result;
}

http.createServer(function(request, response) {

  response.writeHead(200, {
    'Content-Type': 'text/HTML'
  });

  var query = require('url').parse(request.url,true).query;
  if(query.active != undefined){
    if(query.active == 1){
      put_plugin_active(query.file,response);
    }else if(query.active == 0){
      out_plugin_detactive(query.file,response);
    }
  }

  var document = fs.readFileSync('./home.html', 'utf8');

  var template = hbs.compile(document);

  var data = get_plugins_active();

  var data_file = fs.readdirSync("./files");

  var detctive = [];

  data.havefile = [];

  data.detctive = [];

  data_file.forEach(function(data_item){
    var res = data_item.replace(".js", "");
    if(findIndexInData(data.active,'name',res) == -1){
      data.detctive.push({ "name":res,"file" : data_item });
    }
    data.havefile.push({ "name":res,"file" : data_item });
  });

  var result = template(data);



  response.write(result);
  // End response with some nice message.


  response.end('');

}).listen(8000);
