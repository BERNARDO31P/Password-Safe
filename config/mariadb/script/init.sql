CREATE DATABASE IF NOT EXISTS ipa DEFAULT CHARACTER SET UTF8 DEFAULT COLLATE utf8_bin;
USE ipa;

CREATE TABLE IF NOT EXISTS users
(
    user_id          INTEGER PRIMARY KEY AUTO_INCREMENT,
    email            VARCHAR(256)          NOT NULL,
    password         VARCHAR(512)          NOT NULL,
    first_name       VARCHAR(128),
    last_name        VARCHAR(128),
    is_admin         BOOLEAN DEFAULT FALSE NOT NULL,
    is_suspended     BOOLEAN DEFAULT FALSE NOT NULL,
    last_login       INTEGER,
    public_key       VARCHAR(1024),
    private_key      VARCHAR(4096),
    sign_public_key  VARCHAR(1024),
    sign_private_key VARCHAR(4096),
    salt             VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS organizations
(
    org_id      INTEGER PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(128),
    description VARCHAR(512)
);

CREATE TABLE IF NOT EXISTS secret_keys
(
    secret_id  INTEGER PRIMARY KEY AUTO_INCREMENT,
    data VARCHAR(512) NOT NULL,

    user_id    INTEGER      NOT NULL,
    org_id     INTEGER      NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (org_id) REFERENCES organizations (org_id)
);

CREATE TABLE IF NOT EXISTS passwords
(
    pass_id     INTEGER PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(128),
    description VARCHAR(512),
    url         VARCHAR(2048),
    data        LONGTEXT,

    org_id      INTEGER NOT NULL,
    FOREIGN KEY (org_id) REFERENCES organizations (org_id)
);

CREATE TABLE IF NOT EXISTS members
(
    entry_id INTEGER PRIMARY KEY AUTO_INCREMENT,

    user_id  INTEGER NOT NULL,
    org_id   INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (org_id) REFERENCES organizations (org_id)
);

INSERT INTO users
VALUES (1, 'root@brueggli.ch',
        'RiOZZlLU2pT2Jf7zBhNXUuxVPNjSvhalTJjdXZSOAKGksFwVh3MYDNpJPq246XpOS1ZITHmU3V7K070+7flMIA==',
        'root', '', true, false, null,
        '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',
        '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1VtKxwNQqs1K1r6pqAdf\n2090VvorxSdY9EDgaVGAQsiLGaOS3iDhCjTtCRVdBzwqPsQN2cwVcDqmiAOzLJvE\n0RB9neqbsVILXnSVUhvk/4qFbnL3sOWQq4rJtTo/gaddUT4Ip+QNRqDho4uK90j3\nObPrQnNJR/ItgtRxQxW8z2YXZwQdWj5ZLLWfjnKaGESUyKgAARa/HBMrP0yUIt4c\ni+VFXZyMvsxY4/YRZxwKHxZtlh1GBeFoYun26mD9obcdsIi7v+q/XzSM0qPNOmij\nhRNGh1eGgut7eTFb4sDlCyxrrVqFKDA+I7fWB3pWkKsyTupAffFrIvz2jjbPXlHZ\n9QIDAQAB\n-----END PUBLIC KEY-----',
        'V/y/nAluqVKNlUiExJvyjSINCFxbZjdPNCbE5lqa3oTatUnBinIG40IxkxttZvXjzm3LNSTvQuo0tSxrd7ozlzQPfBk880v63yL/PRId/Rv1CG+F3t6gVgHHnCMaGBWeILV2W5/8UGAtOwSwjDOsZfZa7co1HDMYUWlpu9hBsJGlwWEmSJOb6DnE13nVky+oq3kpzBEUR5HySXx+GAUh1KqneL8YMD+eM9ISPflmvxdvZ4wBwPBBbVhvgT35hhIPOah66OpgXIsDOvONlpfhJXBkM7z0c8QVoaqkIS4By8KoAFdc08D93uIdCz85GBCEbEAfmcw9n9pq8OHyVtZdLPYuz7RjydEAEAWhduYyowZPlndfGTXQhdGvuulqjGzRB8jR9FJr3DeoAlCUjPgYlNmVEW5XcjhrPdHLF2dQtjNd4L1W/En1rbeVx3qW/cPdT1Fy+QAh94PjfKSWvhCZ2XDd0/i3UeTHQB4nzd8P3r8WN6RkVPDrZCU5bmlclq+WV68S1NyuoRp3CYAQlDn9DVWrocLMSM5F9Rr9kVergfC+m/u0UdaGLcUNHpa2n9+agvOOEvsNwMwN97gn53+/sC4pdt7v+XL4IzB+CxMowH+J0G6jafE08MyBULiff2H7AMIK2U3fjoG+VpQmpPlj1eYmu3w0UIfQvv2flpoEH5AryvpHl9SFiievXhuZzyfkjeWOj2dqJJeuwdnNBIpaq1+qKKTxmTShE/lQhXon0T8nYd/7AbVl8tngMSxEgHhK8PwqAvs/ORGWPSyIj49RuusE9P7CcYHlvWZ1AeEfsD+kmV19emvsGd8t+HqWaiFrPwpfYUO0PCZwSha7Hta8A66sOkVjMUYzP21/iQjDt7f8G4AtkU13aB76oR+8JS6yKMHUYvzJDmrtI0dTHoLxfCI0JzYyfagJ2VbX0m10gppRR2P7MUxG05/rq3ylj+cDwU//c8bvqpln1O3yiDbeoLLYEGztBwac1sT/RtL0a+7+OTuKRWqkPVx6WAWsLYjYOkay3PSQaqQ3KxvK/SCNx+QJ2Aq9ddpcO5g2fh4FV+0PQR65avXkYkLNDXpK4AqShppbL66GbTbki6E+VdE7cfKDhTyVhwuiPExxUipGbAvfBYNECq/3Me0Enaw7q0sQD2FQQZ//16ZT7yAu7pMO+3wha9E+lM96yQRJM27EBqCduAQo4PvBF7T1XbORGeE6bLU014zhrc/+3q3mQaycqeLJWprVnGIpSXLwOP44C03GVWfMVzZ4bD2bZrcQdyoT2f2lV15W4KwCgIiU04kfzl4IVXRIUmsK8TctgaonMFLL8p5P4S67MTbsErkVTwcoVtOXZQAkJEtJFNsWK2GpZvp2ma5nrCw7T5tVCvTFI8WvAqLTUcAcGnv96B7QZfIeg8WFvqCmUmMh4lHpA14HwgknmWp7yCFAcC+tZBjbGCnYT+nvhgTO8BA9iRQ7VFrBrLgNsKZDLUAZsbzJ6K2IDx7paLqPYjwF3IbrCCKZ5VPu3BPhSeKkY4nxa75pEZXd7pnSWQZn93kUAkto71WX71FwKxOmHSvc2k7eNzci2f9s6xEIwdxBQZzRR/4kwSAZal1POFqvG3STsL1Ia8/phZVk8fskIyV3R0QAPg1EQMIYqC+SHSKvONBTLx0hV6Md9g==',
        'UvMgLnfoA2V/CVVPumXtoQ=='),
       (2, 'bernardo@bernardo.fm',
        'SdYVboYoOFJTTfWOvsn99mU8dfdVV4LSHhQxCmvvUs8WI1hXoTZFsaq7qHFUVDWZ7UxHJnDds3mAkhzIDaJFEQ==',
        'Bernardo', 'de Oliveira', true, false, null,
        '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',
        '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqniRKQiqL7uDsjXBGqTV\nsJIAsv2L0ujC/e0KvsufEKoVZ2W2scVqYWo1qbplejmz2Uk8qwxzgTF9Cj+1Flgo\n5HQOt75EWTeEK11NfF241qGONTO7osv3zRZe41dHcNw3qCaHPKlTth0z0l82kIxJ\nxUeAqD+TXCUKSsB8oKiZI8MUgxd5cqyDa4jSvycKwOtuc536QWk6Bsyw8hjOPEZC\nzR52xhYR8HLtvBHIbrxARzjq8tOlivoQzNq9yLe7HYiMtHZPlfrnlr74Ibrjw4wX\n3oJsd3TBetKvcPWQ93Qb/Dgcw51I3xXh8z9EfucKZuItHIZZlAu9jSWG/6w2ElHa\nKQIDAQAB\n-----END PUBLIC KEY-----',
        '+Z4uDaYyIBGjMnQWFDVehPEmvItSVTMGyyilkP276l6twQt4xOZNgYtVNAK+lcAp3HSip5KLDLNk5EzAIY9Z2FoPBoWgKkb04qAcrCHJJxPLN09JQJNh0qMotoPr+VgmiV0HM1XPkOdXn2GBR1WtzBenETL9jU+VvJnPlccjnSA0qYLlBY43FFpW+ezsNkPcaOjwWekha7o8KQruBUkXF5TDlmEvMiP1X1hDwIUQRHqvDErDwnIrjmM3yq14ui8JguGfeHQqySs5u1o6nGJAZcdyVbbSH46TnzHRNk6E1vuGnhNOfpw2CTC9zTst5FCBF7M20vidzca+tvY4lci15CCJosNksHDiP7a1wfHhRflINYYhfnGGkLbWU8FvYnNH3aHsqX+/zzy38c6pb7vDVp2cqCF1C4mpp6ykVTSrenDsWLQBi0GsmpAAhVdrHlxmg0uDH0DccKuK9mXQlsdgVNdNr0pktHIF+vxsFKnTOQBNFq+YqMnfbL5pxu0zj8Z8k/kDkFuLLaelhesurN0xRQDlo6kvcBOKA5g1e49Nc3jzJ8Lj64tMe/mJ89DO265UMWs6OGKiwMY2m+umKGFQFWXs0Kv9YFREf+RkV4FkLIefASFjyu/xkLKrUSBcGzgUtduUbg6biqveByVHipwwaVHRfVgmzlhs3w/G5XrwSpzbkJ4YDhiBXEDFqBETquXDc72aT7cjSS6VVvIdpFBEbfHbDkgbwaIulwkyOutX7OCgjxuiDudY9IUSziok0aix8qN08f4cFu5c4K/wUJi76S+YoTzfVFhKLsW4HyYTZ4InFvyetVjyqGtvKIGumlaSHQWYvhXe9MUEn3jXA1VeiEQ8wTnsPRdpiVch5gW0WSI/KEVB6cl18fMa6unNgNzzbVO2iy6NKF8f1uOHk1Gpvq3S9ZlncRy5URT/J0ktZcNC4iAo/SG4yciI8u+FaGZpdzCGwE5x2SBv5zKXvuqC7qUT3eFgl+Rq4I867QPZJNUWUXfVJG0CDOSHPwpInsRVoh0OtjKB8jTZ4IqruiKSGZN+CusCpmkQN3t2HA6TG+29yiF4Lt2iGGUH35YDp0LwQ+xW6Z5PiOF2cXyCwk0kbQmfLJ8BuIXNSv0WqnIpNS5qpmcA3KCXteaIgdlLdjH+2JOYBYmoN9+JPBkp6Xf6uAdgQg4qcDJdn/9SmL7e2O5PHUY9CXRNp4fe241IQ19kc4VcMSMnXpImqvYe20oEv1dtCDf5FkwAzsTk2s1owyJmb+mu6SUjYq5Ro0YJn/mnR589DxzON21ONBKKTN6bQMV8+NeljJhwmcHf4TsiwUxnslxu7rV/Fkbn8zLRB33LDMlNSP7Fxpc6allQ/qBZ0j2kcBsim0qxGDSR73tT4Oben1xxErne4toBGrq7xFhcFQSBJ20XoGEWZJhmGjX/7N+HMVpYtCET9XFgGJ6L0ALk/fvXWmumfXg8o1vExEwr9LLxpK+XoLWI4cCMq64N9P4KaCktIdLUZB6vnnOElm0S8iGeDwN9xnqGM1kft1KP4V10Xyzr09Yn2AY98p6Z+Oqe/1yWgj0F/j4AYqhOp5+hTJBgvSFXhujQRz9Yalwd6yU7wwKzr+eHmknvqngcoBkIT9ac8MPtqX/zGvjT3/QAjNsWlOZkALMWd8cE+ffSsqw=',
        'PWqmmZYiVhSF+jDXeUoFNQ==');

CREATE USER IF NOT EXISTS admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';
GRANT ALL PRIVILEGES ON ipa.* TO admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';

FLUSH PRIVILEGES;
