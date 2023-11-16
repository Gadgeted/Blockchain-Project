import {
    query,
    update,
    Canister,
    text,
    Record,
    StableBTreeMap,
    Ok,
    None,
    Some,
    Err,
    Vec,
    Result,
    nat64,
    ic,
    Opt,
    Variant,
} from 'azle';

// TODO: npm install uuid
import { v4 as uuidv4 } from 'uuid';

// This type represents a message that can be listed on a board.
const MessagePayload = Record({
    email: text,
    password: text,
});

const LoginPayload = Record({
    email: text,
    password: text,
});

// Below, we create a Model to represent how a message is Retrieved
const Message = Record({
    id: text,
    email: text,
    password: text,
    createdAt: nat64,
    updatedAt: Opt(nat64),
});

const LogIn = Record({
    id: text,
    email: text,
    password: text,
});

const Error = Variant({
    NotFound: text,
    InvalidPayload: text,
});

const messagesStorage = StableBTreeMap(text, Message, 0);

export default Canister({
    // Below, we add the Message to messageStorage
    userSignUp: update([MessagePayload], Result(Message, Error), (payload) => {
        // Generate uuid, create and update time and our payload
        const message = { id: uuidv4(), createdAt: ic.time(), updatedAt: None, ...payload };
        // Insert the message
        messagesStorage.insert(message.id, message);
        // Return an OK with the message you saved
        return Ok(message);
    }),

    // Below, we get all messages from the storage
    viewMembers: query([], Result(Vec(Message), Error), () => {
        return Ok(messagesStorage.values());
    }),

    // We get specific message from the message storage, we provide the uuid
    logIn: update([LoginPayload], Result(Message, Error), (payload) => {
        const { email } = payload;
        const userFound = messagesStorage.values().some((user) => user.email === email);

        if (userFound) {
            return Ok({ id: uuidv4(), email, password: '****', createdAt: ic.time(), updatedAt: None });
        } else {
            return Err({
                NotFound: `Couldn't log in with email=${email}. User not found.`,
            });
        }
    }),

    // Update a message already in the messageStorage, we provide a uuid
    updateDetails: update([text, MessagePayload], Result(Message, Error), (id, payload) => {
        const messageOpt = messagesStorage.get(id);
        if ('None' in messageOpt) {
            return Err({ NotFound: `Couldn't update the user details with id=${id}. User not found.` });
        }
        const message = messageOpt.Some;
        const updatedMessage = { ...message, ...payload, updatedAt: Some(ic.time()) };
        messagesStorage.insert(message.id, updatedMessage);
        return Ok(updatedMessage);
    }),

    // Delete a message from the messageStorage, we provide a uuid to remove
    deleteUser: update([text], Result(Message, Error), (id) => {
        const deletedUser = messagesStorage.remove(id);
        if ('None' in deletedUser) {
            return Err({ NotFound: `Couldn't delete the user with id=${id}. User not found.` });
        }
        return Ok(deletedUser.Some);
    }),
});

globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        const array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
};
