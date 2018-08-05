#include <eosiolib/eosio.hpp>
#include <eosiolib/print.hpp>
#include <eosiolib/asset.hpp>
using namespace eosio;

	class pure : public eosio::contract {
		public:
			pure(account_name s):
				contract(s), // initialization of the base class for the contract
				_sensor_data(s, s) // initialize the table with code and scope NB! Look up definition of code and scope
		{
		}


			/// @abi action
			/// @param saccount sensor account
			/// @param paccount account to which the reward will be issued
			/// @param sensor latitude
			/// @param sensor longitude
			/// Note: only contract creator can call this action
			void create(account_name saccount, account_name paccount, uint64_t lat, uint64_t lng ) {
				require_auth(_self);
				// Let's make sure the primary key doesn't exist
				eosio_assert(_sensor_data.find(saccount) == _sensor_data.end(), "This sensor pkey already exists in the addressbook");
				_sensor_data.emplace(get_self(), [&]( auto& s ) {
						s.saccount = saccount;
						s.paccount = paccount;
						s.lat = lat;
						s.lng = lng;
						s.health = 0;
						});
			} 

			/// @abi action
			/// @param saccount sensor account sending the water health measurement
			/// Note: if healt > 50 a payment of 1 PURIO will be issued to the paccount 
			///       linked to saccount when the create action was called
			void updatehealth(account_name saccount, uint64_t  health ) {
				// validating permissions
				require_auth( saccount );

				// get sensor data by pkey
				auto sensor_data_itr = _sensor_data.find(saccount);
				// check if the object exists
				eosio_assert(sensor_data_itr != _sensor_data.end(), "Record was not found");
				// update object
				_sensor_data.modify( sensor_data_itr, saccount, [&]( auto& s ) {
						s.health = health;
						});


				if(health > 50)
				{         
					asset quantity(10000,S(4,PURIO));
					account_name paccount = _sensor_data.get(saccount).paccount;
				 	action(
				 			permission_level{ _self, N(active) },
				 			N(eosio.token), N(transfer),
				 			std::make_tuple(_self,paccount, quantity, std::string("Thanks for being green"))
				 	      ).send();
					print("Send token to account ");
					printn(saccount);
				}
			}

			/// @abi action
			/// handy mehtod that returns latest health measurement read by the sensor
			void gethealth( account_name saccount ) {
				// validating permissions
				require_auth( saccount );

				// get sensor data by pkey
				auto sensor_data_itr = _sensor_data.find(saccount);
				// check if the object exists
				eosio_assert(sensor_data_itr != _sensor_data.end(), "Record was not found");
				// update object
				auto sd = _sensor_data.get(saccount);
				print( "health, ", sd.health );
			}

		private: 
			// Setup the struct that represents the row in the table
			/// @abi table sensordata
			struct data {
				account_name saccount; // primary key, sensor account
				account_name paccount; // payment account
				uint64_t lat;	       // latitude
				uint64_t lng;          // longitude
				uint64_t health;       // latest health measurement

				account_name primary_key()const { return saccount; }
				uint64_t by_lat()const { return lat; }
			};


			// We setup the table:
			/// @abi table
			typedef eosio::multi_index< N(sensordata), data, indexed_by<N(bylat), const_mem_fun<data, uint64_t, &data::by_lat>>> sensor_data;

			sensor_data _sensor_data;

	};

EOSIO_ABI( pure, (create)(updatehealth)(gethealth) )
