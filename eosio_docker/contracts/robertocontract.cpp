#include <eosiolib/eosio.hpp>
#include <eosiolib/print.hpp>
using namespace eosio;

 class pure : public eosio::contract {
  public:
   pure(account_name s):
    contract(s), // initialization of the base class for the contract
    _sensor_data(s, s) // initialize the table with code and scope NB! Look up definition of code and scope
  {
  }

   /// @abi action
   void create(account_name username, uint64_t pkey, uint64_t lat, uint64_t lng, uint64_t health ) {
    require_auth(username);
    // Let's make sure the primary key doesn't exist
    // _people.end() is in a way similar to null and it means that the value isn't found
    eosio_assert(_sensor_data.find(pkey) == _sensor_data.end(), "This sensor pkey already exists in the addressbook");
    _sensor_data.emplace(get_self(), [&]( auto& s ) {
      s.pkey = pkey;
      s.lat = lat;
      s.lng = lng;
      s.health = health;
      });
   }

   /// @abi action
   void updatehealth(account_name username, uint64_t pkey,uint64_t  health ) {
    // validating permissions
    require_auth( username );

    // get sensor data by pkey
    auto sensor_data_itr = _sensor_data.find(pkey);
    // check if the object exists
    eosio_assert(sensor_data_itr != _sensor_data.end(), "Record was not found");
    // update object
    _sensor_data.modify( sensor_data_itr, username, [&]( auto& s ) {
      s.health = health;
      });
   }

  private:
   // Setup the struct that represents the row in the table
   /// @abi table _sensor_data
   struct data {
    uint64_t pkey; // primary key, sensor public key
    uint64_t lat;
    uint64_t lng;
    uint64_t health;
    //std::string fullname;
    //uint64_t age;

    uint64_t primary_key()const { return pkey; }
    //uint64_t by_age()const { return age; }
   };

   // We setup the table:
   /// @abi table
   // typedef eosio::multi_index< N(sensor_data), sensor_data, indexed_by<N(byage), const_mem_fun<person, uint64_t, &person::by_age>>>  people;
   typedef eosio::multi_index< N(sensor_data), data>  sensor_data;

   sensor_data _sensor_data;

 };

EOSIO_ABI( pure, (create)(updatehealth) )