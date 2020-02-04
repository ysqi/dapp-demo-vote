pragma solidity >= 0.6.1 < 0.7.0;

contract PhotoVote {
   // 投票事件
    event VotedEvent(address indexed voter, uint256 indexed photoId);

    PhotoInfo[] public photos; //所有参与照片

    // 照片信息
    struct PhotoInfo {
        uint256 id;
        uint256 votes;
        address owner; //上传者
        string url; //照片链接地址
        string story; //照片故事内容
        mapping(address => uint8) voters; //所有投票者,value 是 1 值
    }

    // 参与投票
    function join(string memory url, string memory story)
        public
        returns (uint256 id)
    {
        require(bytes(url).length > 0, "不能为空");
        require(bytes(story).length > 0, "不能为空");

        PhotoInfo memory info = PhotoInfo({
            id: photos.length,
            votes: 0,
            owner: msg.sender,
            url: url,
            story: story
        });

        photos.push(info);
        return info.id;
    }

    // 投票
    function vote(uint256 id) public {
        require(id < photos.length, "不存在对应的照片");
        PhotoInfo storage photo = photos[id];
        require(photo.voters[msg.sender] == 0, "不允许重复投票");
        //更新投票数
        photo.votes++;
        photo.voters[msg.sender] = 1;
        //记录投票日志
        emit VotedEvent(msg.sender, id);
    }
}
