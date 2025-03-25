- step1: set up okta by adding group property: UCAP, UCTM, ALL_SITES
- setp2: update surveys table by adding a new column with below command

```sql
ALTER TABLE [dbo].[surveys] ADD group_name VARCHAR(50) NOT NULL DEFAULT 'UCAP';
```

- step3: modify the backend code to filter out the data based on site/group info
- step4: modify the frontend code to allow admin select different groups while creating new checklist
