import validator from "validator";

export const validateUsername = (username: string): boolean => {
    return validator.isAlphanumeric(username);
};

export const validateDate = (date: string): boolean => {
    return validator.isDate(date);
};

export const validatePastDate = (date: string): boolean => {
    const newDate   = new Date().toISOString().split('T')[0];  
    const inputDate = new Date(date).toISOString().split('T')[0]; 
  
    return inputDate < newDate; 
}