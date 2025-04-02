import logger from "./logger"; 

export function attachOnDisconnectHandler(dbInstance: any, createNewDb: () => any) {
    dbInstance.on("error", (err: any) => {
        console.error("❌ Database connection lost:", err);
        logger.error(`❌ Database connection lost: ${err.message}`);

        if (["ECONNRESET", "PROTOCOL_CONNECTION_LOST"].includes(err.code)) {
            console.log("🔄 Reconnecting to database...");
            logger.warn("🔄 Reconnecting to database...");

            // **Destroy instance lama & buat ulang koneksi baru**
            dbInstance.destroy().then(() => {
                setTimeout(() => {
                    dbInstance = createNewDb();
                    attachOnDisconnectHandler(dbInstance, createNewDb); // Re-attach handler
                }, 2000);
            });
        }
    });
    
}
