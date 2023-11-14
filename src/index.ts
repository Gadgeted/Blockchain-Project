import {
    $query,
    $update,
    Record,
    StableBTreeMap,
    Vec,
    match,
    Result,
    nat64,
    ic,
    Opt,
    Variant,
  } from 'azle';
  // TODO: npm install uuid
  import { v4 as uuidv4 } from 'uuid';
  
  // Define the MessagePayload type for creating a new user or updating user details
  type MessagePayload = Record<{
    email: string;
    password: string;
  }>;
  
  // Define the LoginPayload type for user login
  type LoginPayload = Record<{
    email: string;
    password: string;
  }>;
  
  // Define the Message type for storing user information
  type Message = Record<{
    id: string;
    email: string;
    password: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
  }>;
  
  // Define the LogIn type for successful login response
  type LogIn = Record<{
    id: string;
    email: string;
    password: string;
  }>;
  
  // Define the Error type for handling different error cases
  type Error = Variant<{
    NotFound: string;
    InvalidPayload: string;
  }>;
  
  // Create StableBTreeMap to store user messages
  const messagesStorage = new StableBTreeMap<string, Message>(0, 44, 1024);
  
  // Function to handle user sign-up
  $update;
  export function userSignUp(payload: MessagePayload): Result<Message, string> {
    // Payload Validation: Ensure that required fields are present in the payload
    if (!payload.email || !payload.password) {
      return Result.Err<Message, string>('Invalid payload. Email and password are required.');
    }
  
    // Create a new user message record
    const message: Message = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      email: payload.email,
      password: payload.password,
    };
  
    try {
      // Insert the new user message into the storage
      messagesStorage.insert(message.id, message);
      return Result.Ok(message);
    } catch (error) {
      return Result.Err<Message, string>('Failed to create user. Please try again.');
    }
  }
  
  // Function to view all members
  $query;
  export function viewMembers(): Result<Vec<Message>, string> {
    try {
      // Return all user messages
      return Result.Ok(messagesStorage.values());
    } catch (error) {
      return Result.Err<Vec<Message>, string>('string retrieving user messages. Please try again.');
    }
  }
  
  // Function to handle user login
  $update;
  export function logIn(payload: LoginPayload): Result<string, string> {
    // Payload Validation: Ensure that required fields are present in the payload
    if (!payload.email || !payload.password) {
      return Result.Err<string, string>('Invalid payload. Email and password are required.');
    }
  
    const { email, password } = payload;
  
    try {
      // Get all users from storage
      const allUsers = messagesStorage.values();
  
      // Find the user with the provided email and password
      const user = allUsers.find((u) => u.email === email && u.password === password);
  
      // Check if the user is found or not
      if (user) {
        return Result.Ok('LogIn Success');
      } else {
        // Return an string if the user is not found or the password is incorrect
        return Result.Err<string, string>(
           `Couldn't log in. User with email=${email} not found or password is incorrect.`,
        );
      }
    } catch (error) {
      return Result.Err<string, string>('Error during login. Please try again.');
    }
  }
  
  // Function to update user details
  $update;
  export function updateDetails(id: string, payload: MessagePayload): Result<Message, string> {
    try {
      // Payload Validation: Ensure that required fields are present in the payload
      if (!payload.email || !payload.password) {
        return Result.Err<Message, string>('Invalid payload. Email and password are required.');
      }
  
      // Get the user message by ID
      const messageOpt = messagesStorage.get(id);
  
      return match(messageOpt, {
        Some: (message) => {
          // Create an updated user message
          const updatedMessage: Message = {
            ...message,
            email: payload.email,
            password: payload.password,
            updatedAt: Opt.Some(ic.time()),
          };
  
          // Insert the updated user message into the storage
          messagesStorage.insert(updatedMessage.id, updatedMessage);
          return Result.Ok<Message, string>(updatedMessage);
        },
        None: () => Result.Err<Message, string>( `Couldn't update user details with id=${id}. User not found` ),
      });
    } catch (error) {
      return Result.Err<Message, string>('string updating user details. Please try again.');
    }
  }
  
  // Function to delete a user
  $update;
  export function deleteUser(id: string): Result<Message, string> {
    try {
      // Remove the user message by ID
      const deletedUser = messagesStorage.remove(id);
  
      return match(deletedUser, {
        Some: (user) => Result.Ok<Message, string>(user),
        None: () => Result.Err<Message, string>( `Couldn't delete user with id=${id}. User not found` ),
      });
    } catch (error) {
      return Result.Err<Message, string>('string deleting user. Please try again.');
    }
  }
  
  // Cryptographic utility for generating random values
  globalThis.crypto = {
    //@ts-ignore
    getRandomValues: () => {
      try {
        let array = new Uint8Array(32);
  
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
  
        return array;
      } catch (error) {
        throw new Error('Error generating random values.');
      }
    },
  };
  