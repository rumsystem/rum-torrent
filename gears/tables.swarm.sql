-- USE `sushibar`;

CREATE TABLE `swarm` (
    `id`        BIGINT       NOT NULL AUTO_INCREMENT,
    `_id`       VARCHAR(255) NOT NULL,
    `infoHash`  VARCHAR(255) NOT NULL,
    `peerId`    VARCHAR(255) NOT NULL,
    `type`      VARCHAR(255) NOT NULL,
    `ip`        VARCHAR(255) NOT NULL,
    `socket`    VARCHAR(255) DEFAULT NULL,
    `port`      BIGINT       NOT NULL,
    `complete`  BOOLEAN      NOT NULL,
    `peer`      TEXT         NOT NULL,
    `deleted`   BOOLEAN      NOT NULL DEFAULT FALSE,
    `createdAt` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);

ALTER TABLE `swarm` ADD INDEX _id(`_id`);
ALTER TABLE `swarm` ADD INDEX infoHash(`infoHash`);
ALTER TABLE `swarm` ADD INDEX peerId(`peerId`);
ALTER TABLE `swarm` ADD INDEX type(`type`);
ALTER TABLE `swarm` ADD INDEX ip(`ip`);
ALTER TABLE `swarm` ADD INDEX socket(`socket`);
ALTER TABLE `swarm` ADD INDEX port(`port`);
ALTER TABLE `swarm` ADD INDEX complete(`complete`);
ALTER TABLE `swarm` ADD INDEX createdAt(`createdAt`);
ALTER TABLE `swarm` ADD INDEX updatedAt(`updatedAt`);
CREATE UNIQUE INDEX `infoHash_peerId` ON `swarm`(`infoHash`, `peerId`);
