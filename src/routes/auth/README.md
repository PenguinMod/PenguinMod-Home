# PenguinMod Scratch Auth Frontend

This is a custom frontend for Scratch Auth, made to be a drag-and-drop(not literally in this case) replacement.

## Scratch Auth API

* **GET** https://auth-api.itinerary.eu.org/auth/getTokens
  _Query Options:_
  **redirect**\* - String ( base64 encoded url )
  **username**\* - String ( only used if method is "profile-comment" )
  method - Enum ( "cloud", "comment", "profile-comment" )
  authProject - String ( ID of the Scratch project used for authentication )

* **GET** https://auth-api.itinerary.eu.org/auth/verifyTokens/:privateCode
  _Query Parameters:_
  **privateCode**\* - String ( private code given by `getTokens` )
  _Query Options:_
  **redirect**\* - String ( base64 encoded url, only required when `oneClickSignIn` is true )
  oneClickSignIn - Boolean

* **GET** https://auth-api.itinerary.eu.org/auth/oneClickSignIn
  _Headers:_
  **Authorization**\* - String

* **POST** https://auth-api.itinerary.eu.org/auth/oneClickSignIn/:username
  _Headers:_
  **Authorization**\* - String
  _Query Parameters:_
  **username**\* - String
  _Query Options:_
  **redirect** - String ( base64 encoded url )

* **DELETE** https://auth-api.itinerary.eu.org/auth/oneClickSignIn/:username
  _Headers:_
  **Authorization**\* - String
  _Query Parameters:_
  **username**\* - String