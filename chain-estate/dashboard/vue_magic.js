axios.defaults.baseURL = 'https://chainlease.azurewebsites.net/chicago/';

axios.defaults.headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Credentials': 'true',
};
axios.defaults.validateStatus = function(status) {
  if (status == 202) {
    return status = 200
  }
  return status >= 200 && status < 300; // default
};

var get_info_factom = axios.create({
  method: 'GET',
  url: '',
  strictSSL: false,
});

// The ID of the tennant chain
var tennant_id = "21d11043cff1908e4c2fba0eb45edcefa9913f99d1a13819af665b0588129045";

var api_push_rating_on_chain = axios.create({
  method: 'POST',

  strictSSL: false,
});

// Getting the ratings on the chain of this tennant
var get_ratings_on_chain = axios.create({
  data:{"external_ids": [Base64.encode('Credential')]},
  method: 'POST',
  url: '/chains/' + tennant_id + '/entries/search'
});

//Geting all tenants
var api_get_all_tenants = axios.create({
  method: 'POST',
  url: '/chains/search',
  data: {
    //"external_ids": [Base64.encode("ChainEstate"),Base64.encode("ChainEstateTenant")]
    "external_ids": [Base64.encode("ChainEstate"),"Q2hhaW5Fc3RhdGVUZW5hbnQK"]

  }
});
//Geting all tenants
var api_get_all_landlords = axios.create({
  method: 'POST',
  url: '/chains/search',
  data: {
    //"external_ids": [Base64.encode("ChainEstate"),Base64.encode("ChainEstateTenant")]
    "external_ids": [Base64.encode("ChainEstate"),"Q2hhaW5Fc3RhdGVMYW5kbG9yZAo="]

  }
});

// Check, if the chain is deleted
var api_chain_is_alive = axios.create({
  method: 'POST',
  //url: '/chains/' + tennant_id + '/entries/search'
  data: {
    //"external_ids": [Base64.encode("ChainEstate"),Base64.encode("ChainEstateTenant")]
    "external_ids": [Base64.encode("Deleted")]
  }
});


var get_entry_on_chain_by_hash = axios.create({
  method: 'GET',
});

var entry_hash = ";";

var PropertyID = "d625a573aa5e50ba8a46a6fd0ca5db0a55d3a1a3cc325b836b3a7a546e277410";
var LandlordID = "d5d8d530100ac5d21efe50e62bcbf0bd11abde40a9518cc70a8891089284ce34";
var ce = new Vue({
  el: '#ce',
  data: {
  	api_response:[],
    rating:3,
    rating_data: {
      "PropertyID": PropertyID,
      "LandlordID": 123,

      "Data": {
        "Rating": 3,
        "Comment": "Be kind."
      }
    },
    tenants:[],
    landlords:[],
    rating_list :[],
    images:[
        "assets/images/users/avatar-12.jpg",
        "assets/images/users/avatar-12.jpg",
        "assets/images/users/avatar-12.jpg",
        "assets/images/users/avatar-12.jpg",
        "assets/images/users/avatar-12.jpg",
    ]
  },
  methods: {
  	//Get user data
    get_all_users(){
      //Getting all our chains
      api_get_all_tenants().then(function(response) {
        let data = response.data;
        //Filtering the users from it
        console.log("Tanents:", data);
        let ratings = data.data.reverse();
				ratings.forEach(function(rating){
        	ce.get_by_chain(rating.chain_id,"push",ce.tenants);
        });
      }).catch(error => {
        console.log("Error:", error);
      });
      api_get_all_landlords().then(function(response) {
        let data = response.data;
        //Filtering the users from it
        console.log("landlords:", data);
        let ratings = data.data.reverse();
				ratings.forEach(function(rating){
        	ce.get_by_chain(rating.chain_id,"push",ce.landlords);
        });
      }).catch(error => {
        console.log("Error:", error);
      });


    },
  	//Push the rating to the chain based on rating_data
    push_rating(tenant_id) {
    	var rating_data = JSON.parse(JSON.stringify(ce.rating_data));
    	rating_data.Type = "Landlord Review";
    	rating_data.LandlordID = LandlordID;
    	rating_data.PropertyID = PropertyID;

      //rating_data.review.value = ce.rating;
      let payload = {
        "external_ids": [
            Base64.encode('LandlordReview'),
            Base64.encode('Sig:'+ce.makeid()),
            Base64.encode('Credential')
        ],
        "content": Base64.encode(JSON.stringify(rating_data)),
      };
      api_push_rating_on_chain({
        data: payload,
        url: '/chains/' + tenant_id + '/entries',
      }).then(function(response) {
        let data = response.data;
        console.log('Review pushed:', data);
        ce.api_response = data.entry_hash;
        alert("Review created:"+" https://explorer-hackathon.factom.com/chains/"+tenant_id+"/entries/"+data.entry_hash);
      }).catch(error => {
        console.log("Error:", error);
      });
    },
    //Get the last rating
    get_rating(tenant_id) {
    	ce.rating_list = [];
      get_ratings_on_chain({
        url: '/chains/' + tenant_id + '/entries/search'
      }).then(function(response) {
        let data = response.data;
        console.log('get_ratings_on_chain:', data);
        let ratings = data.data.reverse();
				ratings.forEach(function(rating){
        	ce.get_by_hash(rating.entry_hash,"push",ce.rating_list,tenant_id);
        });

      }).catch(error => {
        console.log("Error:", error);
      });
    },
    //Get the entry by hash and transform the content.
    get_by_hash(entry_hesh, param, the_list,extra_tenant_id) {
      let chain_id = '';
      if (typeof extra_tenant_id !== 'undefined') {
          chain_id = extra_tenant_id;
      }
      else {
        chain_id = tennant_id;
      }

      let url = '/chains/' + chain_id + '/entries/' + entry_hesh;
      get_entry_on_chain_by_hash({
        url: url
      }).then(function(response) {
        let data = response.data;
        console.log('Answer:', data);
        // A dirty hack to show all related ratings.
        if (param === "push"){
          let content = JSON.parse(Base64.decode(data.data.content));
          content.created_at = data.data.created_at;
          content.chain_id = data.data.chain.chain_id;
          content.hash_id = data.data.entry_hash;
          console.log("content of entry:",content);
        	the_list.push(content);
        }
        return Base64.decode(data.data.content);
      }).catch(error => {
        console.log("Error:", error);
      });
    },
    //Get the entry by hash and transform the content.
    get_by_chain(chain_hesh, param, the_list) {
      let url = '/chains/' + chain_hesh + "/entries/first" ;
      //Check first if the chain is not deleted.
      api_chain_is_alive({
        url: '/chains/' + chain_hesh + '/entries/search'
      }).then(function(response) {
        if (response.data.count>0){
          return true
        }
        console.log("Is alive",response);
        //If the chain is not deleted, get the data from it.
        get_entry_on_chain_by_hash({
          url: url
        }).then(function(response) {
          let data = response.data;
          console.log('Answer:', data);
          // A dirty hack to show all related ratings.
          if (param === "push"){
            let content = JSON.parse(Base64.decode(data.data.content));
            content.chain_id = chain_hesh;
            //Pushing values to the communicated list
            the_list.push(content);
            //console.log("the_list",the_list);
            console.log("tenants",ce.tenants);
            console.log("landlords",ce.landlords);
          }
        }).catch(error => {
          console.log("Error:", error);
        });
      }).catch(error => {
        console.log("Error:", error);
      });

    },
    isEven(value) {
      if (value%2 == 0)
        return true;
      else
        return false;
    },
    makeid() {
      var text = "";
      var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < 127; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
    }
  }

});
ce.get_all_users();