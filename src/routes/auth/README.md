# PenguinMod Scratch Auth Frontend

This is a custom frontend for Scratch Auth.

## Scratch Auth API

* **GET** https://auth.itinerary.eu.org/api/auth/getTokens
  _Query Options:_
  **redirect**\* - String ( base64 encoded url )
  method - Enum ( "cloud", "comment" )
  authProject - String ( ID of the Scratch project used for authentication )

* **GET** https://auth.itinerary.eu.org/api/auth/verifyTokens/:privateCode
  _Query Parameters:_
  **privateCode**\* - String ( private code given by `getTokens` )
  _Query Options:_
  **redirect**\* - String ( base64 encoded url, only required when `oneClickSignIn` is true )
  oneClickSignIn - Boolean

* **GET** https://auth.itinerary.eu.org/api/auth/oneClickSignIn
  _Headers:_
  **Authorization**\* - String

* **POST** https://auth.itinerary.eu.org/api/auth/oneClickSignIn/:username
  _Headers:_
  **Authorization**\* - String
  _Query Parameters:_
  **username**\* - String
  _Query Options:_
  **redirect** - String ( base64 encoded url )

* **DELETE** https://auth.itinerary.eu.org/api/auth/oneClickSignIn/:username
  _Headers:_
  **Authorization**\* - String
  _Query Parameters:_
  **username**\* - String