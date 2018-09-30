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

var push_rating_on_chain = axios.create({
  method: 'POST',
  url: '/chains/' + tennant_id + '/entries',
  strictSSL: false,
});

// Getting the ratings on the chain of this tennant
var get_ratings_on_chain = axios.create({
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



var get_entry_on_chain_by_hash = axios.create({
  method: 'GET',
});

var entry_hash = ";";



var ce = new Vue({
  el: '#ce',
  data: {
  	api_response:[],
    rating:3,
    test: new Date(Math.floor(Date.now() / 1000/60/60)*1000*60*60),
    rating_data: {
      "property_id": 123,
      "landlord_id": 123,
      "contract_id": 123,
      "contract_stage": 123,
      "timestemp": 123,
      "review": {
        "value": 123,
        "comment": "good"
      }
    },
    tenants:[],
    landlords:[],
    rating_list :[],
    images:[
        "assets/images/users/avatar-1.jpg",
        "assets/images/users/avatar-2.jpg",
        "assets/images/users/avatar-3.jpg"
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
    push_rating() {
    	var rating_data = JSON.parse(JSON.stringify(ce.rating_data));
      rating_data.review.value = ce.rating;
      let payload = {
        "external_ids": [Base64.encode('credential_type:rating')],
        "content": Base64.encode(JSON.stringify(rating_data)),
      };
      push_rating_on_chain({
        data: payload
      }).then(function(response) {
        let data = response.data;
        console.log('Answer:', data);
        ce.api_response = data.entry_hash;
      }).catch(error => {
        console.log("Error:", error);
      });
    },
    //Get the last rating
    get_rating() {
    	ce.rating_list = [];
      let payload = {
        "external_ids": [Base64.encode('credential_type:rating')]
      };
      get_ratings_on_chain({
        data: payload
      }).then(function(response) {
        let data = response.data;
        console.log('Answer:', data);
        let ratings = data.data.reverse();
				ratings.forEach(function(rating){
        	let content = ce.get_by_hash(rating.entry_hash,"push",ce.api_response);
        });

      }).catch(error => {
        console.log("Error:", error);
      });
    },
    //Get the entry by hash and transform the content.
    get_by_hash(entry_hesh, param, the_list) {
      let url = '/chains/' + tennant_id + '/entries/' + entry_hesh;
      get_entry_on_chain_by_hash({
        url: url
      }).then(function(response) {
        let data = response.data;
        console.log('Answer:', data);
        // A dirty hack to show all related ratings.
        if (param === "push"){
        	the_list.push(Base64.decode(data.data.content));
        }
        return Base64.decode(data.data.content);
      }).catch(error => {
        console.log("Error:", error);
      });
    },
        //Get the entry by hash and transform the content.
    get_by_chain(chain_hesh, param, the_list) {
      let url = '/chains/' + chain_hesh + "/entries/first" ;
      get_entry_on_chain_by_hash({
        url: url
      }).then(function(response) {
        let data = response.data;
        console.log('Answer:', data);
        // A dirty hack to show all related ratings.
        if (param === "push"){
          let content = JSON.parse(Base64.decode(data.data.content));
          content.chain_id = chain_hesh;
        	the_list.push(content);
        	console.log("the_list",the_list);
        }
        return Base64.decode(data.data.content);
      }).catch(error => {
        console.log("Error:", error);
      });
    }
  }

});
ce.get_all_users();